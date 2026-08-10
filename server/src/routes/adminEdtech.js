const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock auth middleware
const mockAdmin = (req, res, next) => {
  if (!req.user) {
    req.user = {
      id: 'demo-admin-id-999',
      organizationId: 'demo-org-id-101',
      email: 'admin@micromind.com',
      displayName: 'System Admin',
      role: 'ADMIN'
    };
  }
  next();
};

router.use(mockAdmin);

// ----------------------------------------------------------------------------
// ACADEMIC TRACKS CATALOG MANAGEMENT
// ----------------------------------------------------------------------------
router.get('/tracks', async (req, res) => {
  try {
    const tracks = await prisma.academicTrack.findMany({
      include: { courses: true }
    });
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tracks', async (req, res) => {
  try {
    const { trackName, code, description, icon, requiredSkills, careerOutcomes } = req.body;
    
    const track = await prisma.academicTrack.create({
      data: {
        organizationId: req.user.organizationId,
        trackName,
        code,
        description,
        icon: icon || 'GraduationCap',
        requiredSkills: requiredSkills || [],
        careerOutcomes: careerOutcomes || []
      }
    });

    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// COURSES MANAGEMENT
// ----------------------------------------------------------------------------
router.get('/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { track: true }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { trackId, code, title, description } = req.body;

    const course = await prisma.course.create({
      data: {
        organizationId: req.user.organizationId,
        trackId: trackId || null,
        code,
        title,
        description
      }
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
