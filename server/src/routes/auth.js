/**
 * Authentication Routes — ShadowMate Platform
 * 
 * Authentication endpoints supporting Student & Admin roles with JWT + bcrypt.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'shadowmate_secret_key_jwt_2026_super_secure_token_12345';

// Pre-configured fallback demo accounts
const DEMO_USERS = [
  {
    id: 'demo-student-id-101',
    email: 'student@micromind.com',
    username: 'student@micromind.com',
    passwordHash: bcrypt.hashSync('student123', 10),
    displayName: 'Alex Rivers (Student)',
    role: 'USER',
    active: true,
    organizationId: 'demo-org-id-101',
    organizationName: 'ShadowMate Academy'
  },
  {
    id: 'demo-admin-id-999',
    email: 'admin@micromind.com',
    username: 'admin@micromind.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    displayName: 'System Admin',
    role: 'ADMIN',
    active: true,
    organizationId: 'demo-org-id-101',
    organizationName: 'ShadowMate Academy'
  },
  {
    id: 'demo-student-acme',
    email: 'user@acme.com',
    username: 'user@acme.com',
    passwordHash: bcrypt.hashSync('user123', 10),
    displayName: 'Demo Student',
    role: 'USER',
    active: true,
    organizationId: 'demo-org-id-101',
    organizationName: 'Acme Academy'
  },
  {
    id: 'demo-admin-acme',
    email: 'admin@acme.com',
    username: 'admin@acme.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    displayName: 'Acme Admin',
    role: 'ADMIN',
    active: true,
    organizationId: 'demo-org-id-101',
    organizationName: 'Acme Academy'
  }
];

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password, email: bodyEmail } = req.body;
        const inputEmail = (bodyEmail || username || '').trim().toLowerCase();

        if (!inputEmail || !password) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Email/Username and password are required'
            });
        }

        let targetUser = null;
        let primaryOrg = null;

        // 1. Check DB first if available
        try {
            const dbUser = await prisma.user.findUnique({
                where: { email: inputEmail },
                include: { memberships: { include: { organization: true } } }
            });

            if (dbUser && dbUser.active) {
                const validPass = await bcrypt.compare(password, dbUser.passwordHash);
                if (validPass) {
                    targetUser = dbUser;
                    primaryOrg = dbUser.memberships?.[0]?.organization;
                }
            }
        } catch (dbErr) {
            // DB fallback to seeded demo users
        }

        // 2. Check Demo fallback accounts if DB check did not yield user
        if (!targetUser) {
            const demoMatch = DEMO_USERS.find(u => u.email.toLowerCase() === inputEmail || u.username.toLowerCase() === inputEmail);
            if (demoMatch) {
                const validDemoPass = await bcrypt.compare(password, demoMatch.passwordHash);
                if (validDemoPass) {
                    targetUser = demoMatch;
                    primaryOrg = { id: demoMatch.organizationId, name: demoMatch.organizationName };
                }
            }
        }

        if (!targetUser) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid credentials. Please check your email and password.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: targetUser.id,
                email: targetUser.email,
                role: targetUser.role,
                displayName: targetUser.displayName || targetUser.name,
                organizationId: primaryOrg?.id || targetUser.organizationId || 'demo-org-id-101'
            },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.json({
            token,
            user: {
                id: targetUser.id,
                email: targetUser.email,
                name: targetUser.displayName || targetUser.name,
                displayName: targetUser.displayName || targetUser.name,
                role: targetUser.role,
                organizationId: primaryOrg?.id || targetUser.organizationId || 'demo-org-id-101',
                organizationName: primaryOrg?.name || targetUser.organizationName || 'ShadowMate Academy'
            }
        });

    } catch (error) {
        console.error('[Auth] Login error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Login failed'
        });
    }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        return res.json({
            id: decoded.id,
            email: decoded.email,
            name: decoded.displayName,
            displayName: decoded.displayName,
            role: decoded.role,
            organizationId: decoded.organizationId
        });

    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router;
