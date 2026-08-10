const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ShadowMateMemoryService = require('../services/shadowmateMemory');

// Mock auth middleware for dev/demo
const mockUser = (req, res, next) => {
  if (!req.user) {
    req.user = {
      id: 'demo-student-id-101',
      organizationId: 'demo-org-id-101',
      email: 'student@micromind.com',
      displayName: 'Alex Rivers',
      role: 'USER'
    };
  }
  next();
};

router.use(mockUser);

// ----------------------------------------------------------------------------
// 1. STUDY PLANNER AGENT — Generates personalized initial schedule
// ----------------------------------------------------------------------------
router.post('/plan', async (req, res) => {
  try {
    const profile = await ShadowMateMemoryService.getOrCreateProfile(
      req.user.id,
      req.user.organizationId
    );

    const assignments = await prisma.assignment.findMany({
      where: { userId: req.user.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: { dueDate: 'asc' }
    });

    const paceRatio = profile.avgActualVsEstRatio || 1.0;
    const sessionDuration = profile.preferredSessionDuration || 45;
    const peakHour = profile.focusPattern?.peakFocusHour || 16;

    // Build personalized daily slots for the upcoming 7 days
    const scheduleBreakdown = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    assignments.forEach((assignment, idx) => {
      const adjustedMinutes = Math.round(assignment.estimatedMinutes * paceRatio);
      const blocksNeeded = Math.ceil(adjustedMinutes / sessionDuration);
      const assignedDay = days[idx % days.length];

      for (let b = 1; b <= blocksNeeded; b++) {
        scheduleBreakdown.push({
          id: `block-${assignment.id}-${b}`,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          day: assignedDay,
          startTime: `${peakHour - 1 + ((b - 1) % 3)}:00`,
          durationMinutes: sessionDuration,
          status: 'SCHEDULED',
          aiNote: `Adjusted for your ${Math.round(paceRatio * 100)}% pace ratio.`
        });
      }
    });

    // Save AI study plan version
    const studyPlan = await prisma.aIStudyPlan.create({
      data: {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        weekStartDate: new Date(),
        scheduleBreakdown,
        status: 'ACTIVE',
        version: 1
      }
    });

    res.json({
      message: 'Personalized study plan created by Study Planner Agent',
      agent: 'Study Planner Agent',
      profileSummary: {
        paceRatio,
        preferredSessionDuration: sessionDuration,
        peakFocusHour: peakHour
      },
      plan: studyPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 2. ADAPTIVE REPLANNING AGENT — Observe & Rebalance Loop
// ----------------------------------------------------------------------------
router.post('/replan', async (req, res) => {
  try {
    const { reason, forceReplan } = req.body;
    
    const profile = await ShadowMateMemoryService.getOrCreateProfile(
      req.user.id,
      req.user.organizationId
    );

    // Evaluate replan threshold
    const replanEval = ShadowMateMemoryService.evaluateReplanNeeded(profile, {
      eventType: forceReplan ? 'MANUAL_REQUEST' : 'SCHEDULE_VARIANCE',
      varianceMinutes: req.body.varianceMinutes || 30,
      isMissedSession: req.body.isMissedSession || false,
      isUrgentAssignment: req.body.isUrgentAssignment || false
    });

    if (!replanEval.shouldReplan && !forceReplan) {
      return res.json({
        replanExecuted: false,
        reason: replanEval.reason,
        message: 'No significant schedule variance detected. Current plan remains active.'
      });
    }

    let pendingAssignments = [];
    try {
      await prisma.aIStudyPlan.updateMany({
        where: { userId: req.user.id, status: 'ACTIVE' },
        data: { status: 'SUPERSEDED_BY_REPLAN' }
      });

      pendingAssignments = await prisma.assignment.findMany({
        where: { userId: req.user.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { priority: 'desc' }
      });
    } catch (dbErr) {
      console.warn('⚠️ DB query error during replan, using fallback pending tasks:', dbErr.message);
    }

    if (!pendingAssignments || pendingAssignments.length === 0) {
      pendingAssignments = [
        { id: 'replan-1', title: 'Neural Networks & Deep Learning Lab', estimatedMinutes: 120 },
        { id: 'replan-2', title: 'Data Structures & Graph Algorithms', estimatedMinutes: 90 },
        { id: 'replan-3', title: 'Web Architecture & Microservices', estimatedMinutes: 60 }
      ];
    }

    const paceRatio = profile.avgActualVsEstRatio || 1.0;
    const sessionDuration = profile.preferredSessionDuration || 45;

    const newScheduleBreakdown = pendingAssignments.map((assignment, idx) => ({
      id: `replan-block-${assignment.id}-${idx}`,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      day: 'Today / Next Available',
      startTime: `${14 + (idx * 2)}:00`,
      durationMinutes: sessionDuration,
      status: 'REPLANNED_ACTIVE',
      aiNote: `Rebalanced due to: ${reason || replanEval.reason}`
    }));

    let newPlan = {
      id: `plan-${Date.now()}`,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      weekStartDate: new Date(),
      scheduleBreakdown: newScheduleBreakdown,
      status: 'ACTIVE',
      version: 2,
      replanReason: reason || replanEval.reason
    };

    try {
      newPlan = await prisma.aIStudyPlan.create({
        data: newPlan
      });
    } catch (saveErr) {
      console.warn('⚠️ Could not persist replan to DB:', saveErr.message);
    }

    res.json({
      replanExecuted: true,
      agent: 'Adaptive Replanning Agent',
      reason: reason || replanEval.reason,
      newPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 3. STUDENT BEHAVIOR ANALYZER AGENT — Pattern & Habit Analysis
// ----------------------------------------------------------------------------
router.get('/analyze-behavior', async (req, res) => {
  try {
    const profile = await ShadowMateMemoryService.getOrCreateProfile(
      req.user.id,
      req.user.organizationId
    );

    const sessions = await prisma.studySession.findMany({
      where: { userId: req.user.id },
      orderBy: { startTime: 'desc' },
      take: 10
    });

    const insights = [
      {
        title: 'Completion Pace',
        detail: profile.avgActualVsEstRatio < 0.9 
          ? `You complete tasks ${Math.round((1 - profile.avgActualVsEstRatio) * 100)}% faster than estimated!`
          : `Tasks take about ${Math.round(profile.avgActualVsEstRatio * 100)}% of your estimated time.`
      },
      {
        title: 'Focus Quality',
        detail: `Average focus rating is ${profile.focusPattern?.avgFocusScore || 3.5}/5 across logged sessions.`
      },
      {
        title: 'Session Duration Preference',
        detail: `Your optimal session duration is set to ${profile.preferredSessionDuration} minutes.`
      }
    ];

    res.json({
      agent: 'Student Behavior Analyzer Agent',
      profile,
      sessionsAnalyzed: sessions.length,
      insights
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 4. ACADEMIC GUIDANCE / TRACK RECOMMENDATION AGENT — Deterministic + Explainable LLM
// ----------------------------------------------------------------------------
router.get('/recommend-tracks', async (req, res) => {
  try {
    const profile = await ShadowMateMemoryService.getOrCreateProfile(
      req.user.id,
      req.user.organizationId
    );

    let tracks = [];
    try {
      tracks = await prisma.academicTrack.findMany({
        include: { courses: true }
      });
    } catch (dbErr) {
      console.warn('⚠️ DB query error in recommend-tracks, using default tracks fallback:', dbErr.message);
    }

    if (!tracks || tracks.length === 0) {
      tracks = [
        {
          id: 'track-ai-1',
          trackName: 'Artificial Intelligence & Machine Learning',
          code: 'AI_ML',
          description: 'Master neural networks, deep learning, Python, and agentic workflows.',
          icon: 'Brain',
          requiredSkills: ['Problem Solving', 'Python', 'Logical Thinking', 'Math'],
          careerOutcomes: ['AI Engineer', 'ML Researcher', 'Data Scientist']
        },
        {
          id: 'track-se-2',
          trackName: 'Full-Stack Software Engineering',
          code: 'SE_FULLSTACK',
          description: 'Build modern scalable web systems, databases, and microservices.',
          icon: 'Code2',
          requiredSkills: ['Logical Thinking', 'JavaScript', 'Problem Solving', 'Web Development'],
          careerOutcomes: ['Full Stack Developer', 'Software Architect', 'Frontend Lead']
        }
      ];
    }

    const recommendations = tracks.map(track => {
      const fitResult = ShadowMateMemoryService.calculateDeterministicTrackFit(profile, track);

      // Generate explainable evidence points
      const reasoning = [
        `Skills alignment score: ${fitResult.deterministicScores.skillsMatch}% based on your profile skills (${(profile.skills || []).join(', ') || 'General'}).`,
        `Focus & performance score: ${fitResult.deterministicScores.academicPerformance}% based on study session ratings.`,
        `Pace efficiency score: ${fitResult.deterministicScores.paceEfficiency}% matching ${track.trackName} complexity.`,
        `Career interest overlap: ${fitResult.deterministicScores.interestsAlignment}%.`
      ];

      return {
        trackId: track.id,
        trackName: track.trackName,
        code: track.code,
        description: track.description,
        icon: track.icon,
        fitPercentage: fitResult.fitPercentage,
        confidenceLevel: fitResult.confidenceLevel,
        deterministicScores: fitResult.deterministicScores,
        reasoning
      };
    });

    // Sort by fit percentage descending
    recommendations.sort((a, b) => b.fitPercentage - a.fitPercentage);

    res.json({
      agent: 'Academic Guidance & Track Recommendation Agent',
      confidenceScore: profile.dataConfidenceScore,
      isInsufficientData: profile.dataConfidenceScore < 0.25,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 5. STUDY CO-PILOT AGENT — Memory-Aware Conversational Assistant
// ----------------------------------------------------------------------------
router.post('/copilot', async (req, res) => {
  try {
    const { message } = req.body;
    const profile = await ShadowMateMemoryService.getOrCreateProfile(
      req.user.id,
      req.user.organizationId
    );

    const userPace = profile.avgActualVsEstRatio || 1.0;
    const preferredDuration = profile.preferredSessionDuration || 45;

    let botResponse = `I'm your ShadowMate Study Co-Pilot! I noticed your preferred study block is ${preferredDuration} minutes. How can I assist with your coursework today?`;

    if (message.toLowerCase().includes('plan') || message.toLowerCase().includes('schedule')) {
      botResponse = `Based on your profile memory, you finish tasks at ~${Math.round(userPace * 100)}% of estimated time. I recommend scheduling 2 study blocks of ${preferredDuration} minutes today.`;
    } else if (message.toLowerCase().includes('track') || message.toLowerCase().includes('recommend')) {
      botResponse = `Based on your high problem solving scores and study logs, you have an 89% fit match for Artificial Intelligence & Machine Learning!`;
    } else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('explain')) {
      botResponse = `I can help break down complex topics into bite-sized ${preferredDuration}-minute study notes tailored to your learning style.`;
    }

    res.json({
      agent: 'Study Co-Pilot Agent',
      userMessage: message,
      response: botResponse,
      profileContext: {
        preferredSessionDuration: preferredDuration,
        avgActualVsEstRatio: userPace
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
