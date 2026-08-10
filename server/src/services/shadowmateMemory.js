const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let MUTABLE_PROFILE_MEMORY = {
  id: 'demo-profile-101',
  userId: 'demo-student-id-101',
  organizationId: 'demo-org-id-101',
  avgActualVsEstRatio: 0.85,
  preferredStudyHours: { morning: 20, afternoon: 30, evening: 50 },
  preferredSessionDuration: 45,
  dailyStudyCapacityMinutes: 180,
  subjectPace: { CS101: 0.85 },
  subjectStrengths: ['Python', 'Problem Solving'],
  subjectWeaknesses: ['Writing'],
  skills: ['Problem Solving', 'Python', 'Logical Thinking'],
  interests: ['Artificial Intelligence', 'Software Development'],
  focusPattern: { peakFocusHour: 16, avgFocusScore: 4.2 },
  delayPattern: { procrastinationIndex: 0.1, missedSessionsCount: 0 },
  manualOverrides: {},
  dataConfidenceScore: 0.15
};

/**
 * ShadowMate Core Memory Engine & Service
 */
class ShadowMateMemoryService {
  /**
   * Fetch or initialize a student's learning profile memory
   */
  static async getOrCreateProfile(userId, organizationId) {
    try {
      let profile = await prisma.studentLearningProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        profile = await prisma.studentLearningProfile.create({
          data: {
            userId,
            organizationId,
            avgActualVsEstRatio: 0.85,
            preferredStudyHours: { morning: 20, afternoon: 30, evening: 50 },
            preferredSessionDuration: 45,
            dailyStudyCapacityMinutes: 180,
            subjectPace: {},
            subjectStrengths: ['Python', 'Problem Solving'],
            subjectWeaknesses: ['Writing'],
            skills: ['Problem Solving', 'Python', 'Logical Thinking'],
            interests: ['Artificial Intelligence', 'Software Development'],
            focusPattern: { peakFocusHour: 16, avgFocusScore: 4.2 },
            delayPattern: { procrastinationIndex: 0.1, missedSessionsCount: 0 },
            manualOverrides: {},
            dataConfidenceScore: 0.15
          }
        });
      }
      await this.ensureDefaultAssignments(userId, organizationId);
      return profile;
    } catch (dbErr) {
      console.warn('⚠️ DB query error in getOrCreateProfile, returning persistent in-memory profile:', dbErr.message);
      return MUTABLE_PROFILE_MEMORY;
    }
  }

  /**
   * Auto-seed default student assignments if user has 0 tasks
   */
  static async ensureDefaultAssignments(userId, organizationId) {
    try {
      const count = await prisma.assignment.count({ where: { userId } });
      if (count === 0) {
        await prisma.assignment.createMany({
          data: [
            {
              userId,
              organizationId,
              title: 'Neural Networks & Deep Learning Assignment',
              description: 'Implement backpropagation and optimizer in Python',
              dueDate: new Date(Date.now() + 86400000 * 2),
              priority: 'HIGH',
              status: 'PENDING',
              estimatedMinutes: 120,
              difficultyRating: 4
            },
            {
              userId,
              organizationId,
              title: 'Data Structures & Graph Algorithms Lab',
              description: 'Dijkstra and A* pathfinding analysis',
              dueDate: new Date(Date.now() + 86400000 * 4),
              priority: 'MEDIUM',
              status: 'IN_PROGRESS',
              estimatedMinutes: 90,
              difficultyRating: 3
            },
            {
              userId,
              organizationId,
              title: 'Web Architecture & Microservices Review',
              description: 'REST API design patterns and caching strategies',
              dueDate: new Date(Date.now() + 86400000 * 6),
              priority: 'LOW',
              status: 'PENDING',
              estimatedMinutes: 60,
              difficultyRating: 2
            }
          ]
        });
      }
    } catch (e) {
      console.error('Error ensuring default assignments:', e.message);
    }
  }

  /**
   * Update student memory following a completed study session or assignment log
   */
  static async updateMemoryFromSession(userId, organizationId, sessionData) {
    const profile = await this.getOrCreateProfile(userId, organizationId);
    
    const { actualDuration, plannedDuration, focusScore, courseCode } = sessionData;

    // Calculate actual vs planned ratio for this session
    const sessionRatio = plannedDuration > 0 ? (actualDuration / plannedDuration) : 1.0;
    
    // Exponential Moving Average for global ratio (alpha = 0.2)
    const newGlobalRatio = Number(((profile.avgActualVsEstRatio * 0.8) + (sessionRatio * 0.2)).toFixed(2));

    // Update subject-specific pace
    const currentSubjectPace = (profile.subjectPace && typeof profile.subjectPace === 'object') 
      ? { ...profile.subjectPace } 
      : {};
    
    if (courseCode) {
      const existingSubjRatio = currentSubjectPace[courseCode] || profile.avgActualVsEstRatio;
      currentSubjectPace[courseCode] = Number(((existingSubjRatio * 0.7) + (sessionRatio * 0.3)).toFixed(2));
    }

    // Update focus pattern
    const currentFocus = (profile.focusPattern && typeof profile.focusPattern === 'object')
      ? { ...profile.focusPattern }
      : { peakFocusHour: 16, avgFocusScore: 3.5 };
    
    const newAvgFocus = Number(((currentFocus.avgFocusScore * 0.8) + (focusScore * 0.2)).toFixed(2));
    const updatedFocusPattern = { ...currentFocus, avgFocusScore: newAvgFocus };

    let completedSessionsCount = 1;
    try {
      completedSessionsCount = await prisma.studySession.count({
        where: { userId, completed: true }
      });
    } catch (dbErr) {
      console.warn('⚠️ Could not query completed sessions count, using fallback count:', dbErr.message);
    }
    
    // Confidence score scales up to 1.0 with 10+ completed sessions
    const newConfidence = Math.min(1.0, Number((0.1 + (completedSessionsCount * 0.09)).toFixed(2)));

    MUTABLE_PROFILE_MEMORY = {
      ...MUTABLE_PROFILE_MEMORY,
      ...profile,
      avgActualVsEstRatio: profile.manualOverrides?.overridePaceRatio ?? newGlobalRatio,
      subjectPace: currentSubjectPace,
      focusPattern: updatedFocusPattern,
      dataConfidenceScore: newConfidence
    };

    let finalProfile = MUTABLE_PROFILE_MEMORY;

    try {
      finalProfile = await prisma.studentLearningProfile.update({
        where: { userId },
        data: {
          avgActualVsEstRatio: profile.manualOverrides?.overridePaceRatio ?? newGlobalRatio,
          subjectPace: currentSubjectPace,
          focusPattern: updatedFocusPattern,
          dataConfidenceScore: newConfidence
        }
      });
      MUTABLE_PROFILE_MEMORY = finalProfile;
    } catch (dbErr) {
      console.warn('⚠️ Could not persist profile update to DB, returning updated memory object:', dbErr.message);
    }

    return finalProfile;
  }

  /**
   * Update student memory from student feedback
   */
  static async updateMemoryFromFeedback(userId, organizationId, feedbackData) {
    const profile = await this.getOrCreateProfile(userId, organizationId);
    const { feedbackType, rating, comment } = feedbackData;

    const updates = {};
    if (feedbackType === 'SESSION_LENGTH') {
      if (rating <= 2) {
        updates.preferredSessionDuration = Math.max(25, profile.preferredSessionDuration - 15);
      } else if (rating >= 4) {
        updates.preferredSessionDuration = Math.min(90, profile.preferredSessionDuration + 15);
      }
    } else if (feedbackType === 'TIME_ESTIMATE') {
      if (rating <= 2) {
        // "Time estimate was too long" -> speed up expectations
        updates.avgActualVsEstRatio = Math.max(0.5, profile.avgActualVsEstRatio * 0.9);
      } else if (rating >= 4) {
        // "Time estimate was too short / needed more time"
        updates.avgActualVsEstRatio = Math.min(2.0, profile.avgActualVsEstRatio * 1.15);
      }
    }

    const updatedProfile = await prisma.studentLearningProfile.update({
      where: { userId },
      data: updates
    });

    return updatedProfile;
  }

  /**
   * Transparent manual editing of Student Profile Memory by the student
   */
  static async updateManualOverrides(userId, organizationId, manualData) {
    const profile = await this.getOrCreateProfile(userId, organizationId);
    
    const existingOverrides = (profile.manualOverrides && typeof profile.manualOverrides === 'object')
      ? profile.manualOverrides
      : {};

    const updatedOverrides = {
      ...existingOverrides,
      ...manualData
    };

    const dataToUpdate = {
      manualOverrides: updatedOverrides
    };

    if (manualData.preferredSessionDuration) {
      dataToUpdate.preferredSessionDuration = parseInt(manualData.preferredSessionDuration);
    }
    if (manualData.dailyStudyCapacityMinutes) {
      dataToUpdate.dailyStudyCapacityMinutes = parseInt(manualData.dailyStudyCapacityMinutes);
    }
    if (manualData.skills) {
      dataToUpdate.skills = manualData.skills;
    }
    if (manualData.interests) {
      dataToUpdate.interests = manualData.interests;
    }
    if (manualData.subjectStrengths) {
      dataToUpdate.subjectStrengths = manualData.subjectStrengths;
    }
    if (manualData.subjectWeaknesses) {
      dataToUpdate.subjectWeaknesses = manualData.subjectWeaknesses;
    }

    return await prisma.studentLearningProfile.update({
      where: { userId },
      data: dataToUpdate
    });
  }

  /**
   * Threshold-gated evaluation for Meaningful Adaptive Replanning
   */
  static evaluateReplanNeeded(profile, eventData) {
    const { eventType, varianceMinutes, isMissedSession, isUrgentAssignment } = eventData;

    // Filter out trivial delays (< 15 mins or insignificant variance)
    if (eventType === 'SESSION_COMPLETED' && !isMissedSession) {
      if (Math.abs(varianceMinutes) < 15) {
        return { shouldReplan: false, reason: 'Variance below 15 minute threshold' };
      }
    }

    if (isMissedSession) {
      return { shouldReplan: true, reason: 'Missed study session requires rescheduling' };
    }

    if (isUrgentAssignment) {
      return { shouldReplan: true, reason: 'Urgent deadline requires plan adjustment' };
    }

    if (Math.abs(varianceMinutes) >= 25) {
      return { shouldReplan: true, reason: `Significant pace variance of ${varianceMinutes} minutes observed` };
    }

    if (eventType === 'MANUAL_REQUEST') {
      return { shouldReplan: true, reason: 'Student requested schedule refresh' };
    }

    return { shouldReplan: false, reason: 'Event within normal tolerance' };
  }

  /**
   * Deterministic Track Recommendation Scoring Engine
   */
  static calculateDeterministicTrackFit(profile, track, assignments = [], sessions = []) {
    // 1. Skills Match (40%)
    const reqSkills = track.requiredSkills || [];
    const studentSkills = [...(profile.skills || []), ...(profile.interests || [])];
    
    let skillsMatchCount = 0;
    if (reqSkills.length > 0) {
      reqSkills.forEach(req => {
        if (studentSkills.some(s => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()))) {
          skillsMatchCount++;
        }
      });
    }
    const skillsMatchScore = reqSkills.length > 0 
      ? Math.round((skillsMatchCount / reqSkills.length) * 100)
      : 70;

    // 2. Academic Performance & Focus (30%)
    const focusPattern = profile.focusPattern || {};
    const avgFocus = focusPattern.avgFocusScore || 3.5;
    const focusScorePct = Math.round((avgFocus / 5.0) * 100);

    // 3. Pace Efficiency & Consistency (20%)
    const globalRatio = profile.avgActualVsEstRatio || 1.0;
    // Optimal pace ratio is ~0.8 to 1.1
    let paceScore = 80;
    if (globalRatio >= 0.7 && globalRatio <= 1.1) {
      paceScore = 95;
    } else if (globalRatio < 0.7) {
      paceScore = 85; // Faster than estimated
    } else {
      paceScore = Math.max(50, Math.round(100 - ((globalRatio - 1.1) * 40)));
    }

    // 4. Interests Alignment (10%)
    const interests = profile.interests || [];
    const outcomes = track.careerOutcomes || [];
    let interestOverlap = 0;
    outcomes.forEach(out => {
      if (interests.some(i => out.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(out.toLowerCase()))) {
        interestOverlap++;
      }
    });
    const interestScore = outcomes.length > 0 
      ? Math.min(100, Math.round((interestOverlap / outcomes.length) * 100) + 40)
      : 75;

    // Weighted Deterministic Composite Fit Score
    const fitPercentage = Math.round(
      (skillsMatchScore * 0.40) +
      (focusScorePct * 0.30) +
      (paceScore * 0.20) +
      (interestScore * 0.10)
    );

    const confidenceScore = profile.dataConfidenceScore || 0.1;
    let confidenceLevel = 'INSUFFICIENT_DATA';

    if (confidenceScore >= 0.7) {
      confidenceLevel = 'HIGH';
    } else if (confidenceScore >= 0.4) {
      confidenceLevel = 'MEDIUM';
    } else if (confidenceScore >= 0.25) {
      confidenceLevel = 'LOW';
    } else {
      confidenceLevel = 'INSUFFICIENT_DATA';
    }

    return {
      fitPercentage: Math.min(99, Math.max(40, fitPercentage)),
      confidenceLevel,
      deterministicScores: {
        skillsMatch: skillsMatchScore,
        academicPerformance: focusScorePct,
        paceEfficiency: paceScore,
        interestsAlignment: interestScore
      }
    };
  }
}

module.exports = ShadowMateMemoryService;
