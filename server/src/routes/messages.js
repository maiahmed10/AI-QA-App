const express = require('express');
const router = express.Router();

/**
 * POST /api/messages
 * QA Testing Endpoint
 */
router.post('/', (req, res) => {
    const body = req.body || {};

    // Support message property at top-level or nested inside body.data
    const message = body.message !== undefined 
        ? body.message 
        : (body.data && typeof body.data === 'object' ? body.data.message : undefined);

    // Check if message field is missing
    if (message === undefined) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Message field is required'
        });
    }

    // Check if message is non-string
    if (typeof message !== 'string') {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Message must be a string'
        });
    }

    // INTENTIONAL BUG: Empty string should return HTTP 400,
    // but the empty string check (e.g. message.trim() === '') is intentionally omitted/bypassed.
    // Thus empty string returns HTTP 200.

    return res.status(200).json({
        status: 'success',
        data: {
            message: message
        }
    });
});

module.exports = router;
