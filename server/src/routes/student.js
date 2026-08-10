const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ShadowMateMemoryService = require('../services/shadowmateMemory');

// Mock auth middleware for dev/demo if auth check is missing
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
// STUDENT PROFILE MEMORY (Transparent & Editable)
// ----------------------------------------------------------------------------
router.get('/profile', async (req, res) => {
  try {
    const profile = await ShadowMateMemoryService.getOrCreateProfile(
      req.user.id,
      req.user.organizationId
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile/manual', async (req, res) => {
  try {
    const updated = await ShadowMateMemoryService.updateManualOverrides(
      req.user.id,
      req.user.organizationId,
      req.body
    );
    res.json({ message: 'Profile memory updated successfully', profile: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// In-memory fallback assignments store for zero-friction operation
const IN_MEMORY_ASSIGNMENTS = [
  {
    id: 'demo-assign-1',
    userId: 'demo-student-id-101',
    organizationId: 'demo-org-id-101',
    title: 'Neural Networks & Deep Learning Assignment',
    description: 'Implement backpropagation and optimizer in Python',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    priority: 'HIGH',
    status: 'PENDING',
    estimatedMinutes: 120,
    difficultyRating: 4
  },
  {
    id: 'demo-assign-2',
    userId: 'demo-student-id-101',
    organizationId: 'demo-org-id-101',
    title: 'Data Structures & Graph Algorithms Lab',
    description: 'Dijkstra and A* pathfinding analysis',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    estimatedMinutes: 90,
    difficultyRating: 3
  },
  {
    id: 'demo-assign-3',
    userId: 'demo-student-id-101',
    organizationId: 'demo-org-id-101',
    title: 'Web Architecture & Microservices Review',
    description: 'REST API design patterns and caching strategies',
    dueDate: new Date(Date.now() + 86400000 * 6).toISOString(),
    priority: 'LOW',
    status: 'PENDING',
    estimatedMinutes: 60,
    difficultyRating: 2
  }
];

// ----------------------------------------------------------------------------
// ASSIGNMENTS MANAGEMENT
// ----------------------------------------------------------------------------
router.get('/assignments', async (req, res) => {
  try {
    await ShadowMateMemoryService.ensureDefaultAssignments(req.user.id, req.user.organizationId);
    const assignments = await prisma.assignment.findMany({
      where: { userId: req.user.id },
      include: { course: true, feedbacks: true },
      orderBy: { dueDate: 'asc' }
    });
    return res.json(assignments);
  } catch (error) {
    console.warn('⚠️ DB query error on GET assignments, returning fallback memory assignments:', error.message);
    const userAssignments = IN_MEMORY_ASSIGNMENTS.filter(a => a.userId === req.user.id || a.userId === 'demo-student-id-101');
    return res.json(userAssignments);
  }
});

router.post('/assignments', async (req, res) => {
  const { title, description, courseId, dueDate, priority, estimatedMinutes, difficultyRating } = req.body;
  const newAssignmentData = {
    id: `assign-${Date.now()}`,
    userId: req.user.id || 'demo-student-id-101',
    organizationId: req.user.organizationId || 'demo-org-id-101',
    title: title || 'New Assignment',
    description: description || '',
    courseId: courseId || null,
    dueDate: new Date(dueDate || Date.now() + 86400000 * 3).toISOString(),
    priority: priority || 'MEDIUM',
    status: 'PENDING',
    estimatedMinutes: parseInt(estimatedMinutes || 60),
    difficultyRating: parseInt(difficultyRating || 3)
  };

  try {
    const assignment = await prisma.assignment.create({
      data: {
        ...newAssignmentData,
        dueDate: new Date(newAssignmentData.dueDate)
      }
    });
    return res.status(201).json(assignment);
  } catch (error) {
    console.warn('⚠️ DB query error on POST assignments, saving to fallback memory store:', error.message);
    IN_MEMORY_ASSIGNMENTS.unshift(newAssignmentData);
    return res.status(201).json(newAssignmentData);
  }
});

router.patch('/assignments/:id', async (req, res) => {
  const { status, actualMinutesSpent, difficultyRating } = req.body;
  try {
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(actualMinutesSpent !== undefined && { actualMinutesSpent: parseInt(actualMinutesSpent) }),
        ...(difficultyRating !== undefined && { difficultyRating: parseInt(difficultyRating) })
      }
    });
    return res.json(assignment);
  } catch (error) {
    console.warn('⚠️ DB query error on PATCH assignment, updating fallback memory item:', error.message);
    const idx = IN_MEMORY_ASSIGNMENTS.findIndex(a => a.id === req.params.id);
    if (idx !== -1) {
      if (status) IN_MEMORY_ASSIGNMENTS[idx].status = status;
      if (actualMinutesSpent !== undefined) IN_MEMORY_ASSIGNMENTS[idx].actualMinutesSpent = parseInt(actualMinutesSpent);
      if (difficultyRating !== undefined) IN_MEMORY_ASSIGNMENTS[idx].difficultyRating = parseInt(difficultyRating);
      return res.json(IN_MEMORY_ASSIGNMENTS[idx]);
    }
    return res.status(404).json({ error: 'Assignment not found' });
  }
});

// ----------------------------------------------------------------------------
// STUDY SESSIONS LOGGING
// ----------------------------------------------------------------------------
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: req.user.id },
      orderBy: { startTime: 'desc' },
      take: 20
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const { assignmentId, courseCode, title, plannedDuration, actualDuration, focusScore, notes, completed } = req.body;

    let session = {
      id: `session-${Date.now()}`,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      assignmentId: assignmentId || null,
      courseCode: courseCode || 'GENERAL',
      title: title || 'Focused Study Session',
      startTime: new Date(Date.now() - (actualDuration || 45) * 60000),
      endTime: new Date(),
      plannedDuration: parseInt(plannedDuration || 45),
      actualDuration: parseInt(actualDuration || 45),
      focusScore: parseInt(focusScore || 4),
      completed: completed !== false,
      notes
    };

    try {
      session = await prisma.studySession.create({
        data: session
      });
    } catch (dbErr) {
      console.warn('⚠️ Could not persist study session to DB, using in-memory object:', dbErr.message);
    }

    // Update Student Memory Profile automatically after session!
    const updatedProfile = await ShadowMateMemoryService.updateMemoryFromSession(
      req.user.id,
      req.user.organizationId,
      {
        actualDuration: session.actualDuration,
        plannedDuration: session.plannedDuration,
        focusScore: session.focusScore,
        courseCode: session.courseCode
      }
    );

    // Evaluate if Threshold-gated Replan is required
    const varianceMinutes = session.actualDuration - session.plannedDuration;
    const replanEval = ShadowMateMemoryService.evaluateReplanNeeded(updatedProfile, {
      eventType: 'SESSION_COMPLETED',
      varianceMinutes,
      isMissedSession: !session.completed
    });

    res.status(201).json({
      session,
      profileSummary: {
        avgActualVsEstRatio: updatedProfile.avgActualVsEstRatio,
        dataConfidenceScore: updatedProfile.dataConfidenceScore
      },
      replanRecommended: replanEval
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// STUDENT FEEDBACK LOOP
// ----------------------------------------------------------------------------
router.post('/feedback', async (req, res) => {
  try {
    const { assignmentId, sessionId, feedbackType, rating, comment } = req.body;

    const feedback = await prisma.studentFeedback.create({
      data: {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        assignmentId: assignmentId || null,
        sessionId: sessionId || null,
        feedbackType: feedbackType || 'TIME_ESTIMATE',
        rating: parseInt(rating || 3),
        comment,
        appliedToProfile: true
      }
    });

    // Apply feedback to Student Profile Memory
    const updatedProfile = await ShadowMateMemoryService.updateMemoryFromFeedback(
      req.user.id,
      req.user.organizationId,
      { feedbackType, rating, comment }
    );

    res.status(201).json({
      message: 'Feedback recorded and memory updated',
      feedback,
      updatedProfilePace: updatedProfile.avgActualVsEstRatio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
