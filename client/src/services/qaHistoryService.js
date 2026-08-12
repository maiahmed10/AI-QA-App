/**
 * Centralized Testing History Persistence Service.
 * Manages Test Execution records and dispatches sync events.
 */

import { generateSeedExecutions } from '../data/qaTestData';

const STORAGE_KEY_TEST_HISTORY = 'qa_testing_history_v3';

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
    const seed = generateSeedExecutions();
    localStorage.setItem(STORAGE_KEY_TEST_HISTORY, JSON.stringify(seed));
    return seed;
};

export const saveTestingRecord = (record) => {
    const history = getTestingHistory();
    const now = new Date();
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord = {
        id: record.id || `EXEC-${Date.now().toString().slice(-4)}`,
        executionId: record.id || `EXEC-${Date.now().toString().slice(-4)}`,
        testCaseId: record.testCaseId || record.tcId || 'TC-001',
        description: record.description || record.question || 'QA Workflow Test Execution',
        question: record.question || record.description || 'QA Test Scenario',
        method: record.method || record.requestMethod || 'POST',
        target: `${record.method || 'POST'} ${record.endpoint || '/api/messages'}`,
        endpoint: record.endpoint || '/api/messages',
        requestData: record.requestData || 'None',
        expectedBehavior: record.expectedBehavior || record.expectedStatus || 'HTTP 200 OK',
        expectedStatus: record.expectedBehavior || record.expectedStatus || 'HTTP 200 OK',
        actualBehavior: record.actualBehavior || record.actualStatus || record.httpCode || 'HTTP 200 OK',
        actualStatus: record.actualBehavior || record.actualStatus || record.httpCode || 'HTTP 200 OK',
        status: record.status || 'PASS',
        httpStatus: record.httpCode || record.httpStatus || 'HTTP 200 OK',
        httpCode: record.httpCode || record.httpStatus || 'HTTP 200 OK',
        responseBody: record.responseBody || record.response || 'N/A',
        response: record.response || record.responseBody || 'N/A',
        responseTime: record.responseTime || record.timeMs || '150ms',
        timeMs: record.responseTime || record.timeMs || '150ms',
        timestamp: `${dateStr} ${timeStr}`,
        date: dateStr,
        time: timeStr,
        bugTitle: record.bugTitle || null,
        bugDescription: record.bugDescription || null
    };

    // Prepend new execution record so newest appears first
    const updated = [newRecord, ...history];
    localStorage.setItem(STORAGE_KEY_TEST_HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new Event('qa_testing_history_updated'));
    return newRecord;
};

export const deleteTestingRecord = (id) => {
    const history = getTestingHistory();
    const updated = history.filter(item => item.id !== id && item.executionId !== id);
    localStorage.setItem(STORAGE_KEY_TEST_HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new Event('qa_testing_history_updated'));
    return updated;
};

export const clearTestingHistory = () => {
    localStorage.setItem(STORAGE_KEY_TEST_HISTORY, JSON.stringify([]));
    window.dispatchEvent(new Event('qa_testing_history_updated'));
    return [];
};
