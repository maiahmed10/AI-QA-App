const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ type: '*/*' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'MicroMind Base Template API',
        version: '1.0.0'
    });
});

// API Routes
const authRoutes = require('./routes/auth');
const managerRoutes = require('./routes/manager');
const studentRoutes = require('./routes/student');
const shadowmateAiRoutes = require('./routes/shadowmateAi');
const adminEdtechRoutes = require('./routes/adminEdtech');
const dashboardRoutes = require('./routes/dashboards');
const aiRoutes = require('./routes/ai');
const messagesRoutes = require('./routes/messages');

app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/v1/ai/shadowmate', shadowmateAiRoutes);
app.use('/api/admin/edtech', adminEdtechRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/messages', messagesRoutes);

// Placeholder routes
app.get('/api', (req, res) => {
    res.json({
        message: 'ShadowMate Adaptive EdTech Platform API',
        version: '2.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            student: '/api/student/*',
            shadowmateAi: '/api/v1/ai/shadowmate/*',
            adminEdtech: '/api/admin/edtech/*'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 MicroMind Base Template Server');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
    console.log('');
});

module.exports = app;
