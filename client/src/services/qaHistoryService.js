/**
 * Centralized Multi-Type Testing History Persistence Service.
 * Supports AI Response Testing, Website Testing, and Mobile App Testing.
 */

const STORAGE_KEY_TEST_HISTORY = 'qa_testing_history_v2';

const defaultSeedHistory = [
    {
        id: 'HIST-1006',
        type: 'Website',
        target: 'https://example.com',
        description: 'Web UI Navigation & Responsive Viewport Audit',
        timestamp: 'Aug 10, 2026 16:15',
        date: 'Aug 10, 2026',
        time: '16:15',
        question: 'Web UI Specs for https://example.com: Header responsiveness, navigation links, and DOM accessibility',
        response: 'DOM tree parsed. 12 UI components verified. Navigation link contrast meets WCAG 2.1 AA standards.',
        status: 'PASS',
        score: '98%',
        severity: 'Low',
        issues: [],
        feedback: 'Website UI layout meets accessibility and responsiveness specifications.'
    },
    {
        id: 'HIST-1005',
        type: 'App',
        target: 'com.micromind.companion',
        description: 'Mobile App Device Compatibility & Offline Sync Queue Test',
        timestamp: 'Aug 10, 2026 16:00',
        date: 'Aug 10, 2026',
        time: '16:00',
        question: 'App Specs for MicroMind Mobile Companion: Session token storage and offline sync queue',
        response: 'Encrypted storage verified. Background sync queue processed 5 pending records upon reconnect.',
        status: 'PASS',
        score: '92%',
        severity: 'Low',
        issues: [],
        feedback: 'App offline queue synchronization passed without data corruption.'
    },
    {
        id: 'HIST-1004',
        type: 'AI',
        target: 'POST /api/messages',
        description: 'Valid non-empty message parameter payload test',
        timestamp: 'Aug 10, 2026 15:45',
        date: 'Aug 10, 2026',
        time: '15:45',
        question: 'Test POST /api/messages. The API accepts a required non-empty message parameter.',
        response: 'The API validates the mandatory message parameter and returns HTTP 200 OK for non-empty string inputs.',
        status: 'PASS',
        score: '100%',
        severity: 'Low',
        issues: [],
        feedback: 'Excellent API parameter validation. All edge cases and type validations satisfy specification.'
    },
    {
        id: 'HIST-1003',
        type: 'AI',
        target: 'POST /api/messages',
        description: 'Empty string parameter payload validation check',
        timestamp: 'Aug 10, 2026 15:24',
        date: 'Aug 10, 2026',
        time: '15:24',
        question: 'Empty string parameter payload check: {"message": ""}',
        response: 'Endpoint accepted empty string "" payload with HTTP 200 OK instead of HTTP 400 Bad Request.',
        status: 'FAIL',
        score: '50%',
        severity: 'Medium',
        issues: ['Empty string parameter accepted with HTTP 200 OK instead of HTTP 400 Bad Request.'],
        feedback: 'Validation middleware bypass detected. Empty payload should be rejected at API ingress.'
    },
    {
        id: 'HIST-1002',
        type: 'AI',
        target: 'POST /api/messages',
        description: 'Missing required field payload check: {}',
        timestamp: 'Aug 10, 2026 15:10',
        date: 'Aug 10, 2026',
        time: '15:10',
        question: 'Missing message field payload check: {}',
        response: 'HTTP 400 Bad Request returned with error message: "Message parameter is required."',
        status: 'PASS',
        score: '100%',
        severity: 'Low',
        issues: [],
        feedback: 'Correct HTTP 400 response code and JSON error schema returned.'
    }
];

export const getTestingHistory = () => {
    const saved = localStorage.getItem(STORAGE_KEY_TEST_HISTORY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
            console.warn('Failed to parse testing history from localStorage:', e);
        }
    }
    // Seed multi-type history records if empty
    localStorage.setItem(STORAGE_KEY_TEST_HISTORY, JSON.stringify(defaultSeedHistory));
    return defaultSeedHistory;
};

export const saveTestingRecord = (record) => {
    const history = getTestingHistory();
    const now = new Date();
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let detectedType = record.type;
    if (!detectedType) {
        const qStr = record.question || '';
        if (qStr.includes('[Web UI Spec')) {
            detectedType = 'Website';
        } else if (qStr.includes('[Mobile App Spec')) {
            detectedType = 'App';
        } else {
            detectedType = 'AI';
        }
    }

    let targetVal = record.target;
    if (!targetVal) {
        if (detectedType === 'Website') {
            targetVal = record.websiteUrl || 'https://example.com';
        } else if (detectedType === 'App') {
            targetVal = record.appName || 'com.micromind.companion';
        } else {
            targetVal = 'POST /api/messages';
        }
    }

    const newRecord = {
        id: record.id || `HIST-${Date.now().toString().slice(-4)}`,
        type: detectedType,
        target: targetVal,
        description: record.description || record.question || 'QA Workflow Test Execution',
        timestamp: `${dateStr} ${timeStr}`,
        date: dateStr,
        time: timeStr,
        question: record.question || 'N/A',
        response: record.response || 'N/A',
        status: record.status || 'PASS',
        score: record.score || '95%',
        severity: record.severity || (record.status === 'FAIL' ? 'Medium' : 'Low'),
        issues: Array.isArray(record.issues) ? record.issues : (record.issues ? [record.issues] : []),
        feedback: record.feedback || 'QA Workflow evaluation complete.'
    };

    const updated = [newRecord, ...history];
    localStorage.setItem(STORAGE_KEY_TEST_HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new Event('qa_testing_history_updated'));
    return newRecord;
};

export const deleteTestingRecord = (id) => {
    const history = getTestingHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY_TEST_HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new Event('qa_testing_history_updated'));
    return updated;
};

export const clearTestingHistory = () => {
    localStorage.setItem(STORAGE_KEY_TEST_HISTORY, JSON.stringify([]));
    window.dispatchEvent(new Event('qa_testing_history_updated'));
    return [];
};
