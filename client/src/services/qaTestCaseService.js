/**
 * Centralized Test Case State & Defect Management Service.
 * Dynamically reconciles failed execution records into unique deduplicated Defects with occurrence tracking.
 */

import { initialTestCasesData } from '../data/qaTestData';
import { getTestingHistory } from './qaHistoryService';

const STORAGE_KEY_TEST_CASES = 'qa_test_cases_suite_v3';
const STORAGE_KEY_BUGS = 'qa_bugs_suite_v3';

/**
 * Gets current active unique Test Cases
 */
export const getTestCases = () => {
    const saved = localStorage.getItem(STORAGE_KEY_TEST_CASES);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
            console.warn('Failed to parse test cases from localStorage:', e);
        }
    }
    localStorage.setItem(STORAGE_KEY_TEST_CASES, JSON.stringify(initialTestCasesData));
    return initialTestCasesData;
};

/**
 * Saves full test cases array to localStorage and notifies subscribers
 */
export const saveAllTestCases = (testCasesList) => {
    localStorage.setItem(STORAGE_KEY_TEST_CASES, JSON.stringify(testCasesList));
    window.dispatchEvent(new Event('qa_test_cases_updated'));
    return testCasesList;
};

/**
 * Adds a new unique Test Case without duplicating existing ones
 */
export const addTestCase = (newTestCase) => {
    const current = getTestCases();
    const now = new Date();
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    const formattedCase = {
        id: newTestCase.id || `TC-00${current.length + 1}`,
        description: newTestCase.description || newTestCase.name || 'API Test Case',
        name: newTestCase.name || newTestCase.description || 'API Test Case',
        type: newTestCase.type || (newTestCase.expectedResult?.includes('400') || newTestCase.expectedResult?.includes('404') ? 'Negative' : 'Positive'),
        method: newTestCase.method || newTestCase.requestMethod || 'POST',
        endpoint: newTestCase.endpoint || '/api/messages',
        requestData: newTestCase.requestData || newTestCase.payload || 'None',
        payload: newTestCase.payload || newTestCase.requestData || 'None',
        expectedResult: newTestCase.expectedResult || 'HTTP 200 OK',
        creationDate: newTestCase.creationDate || dateStr,
        status: newTestCase.status || 'PASS'
    };

    const existsIndex = current.findIndex(tc => tc.id === formattedCase.id || (tc.endpoint === formattedCase.endpoint && tc.method === formattedCase.method && tc.description === formattedCase.description));
    
    let updated;
    if (existsIndex >= 0) {
        updated = current.map((tc, idx) => idx === existsIndex ? { ...tc, ...formattedCase } : tc);
    } else {
        updated = [...current, formattedCase];
    }
    return saveAllTestCases(updated);
};

/**
 * Deletes a Test Case by ID
 */
export const deleteTestCase = (id) => {
    const current = getTestCases();
    const updated = current.filter(tc => tc.id !== id);
    return saveAllTestCases(updated);
};

/**
 * Updates test case result in place
 */
export const updateTestCaseResult = (testCaseId, newStatus, actualResultText, failureReason = null) => {
    if (!testCaseId) return null;

    const currentCases = getTestCases();
    let updatedCase = null;

    const updatedCases = currentCases.map((tc) => {
        if (tc.id === testCaseId) {
            updatedCase = {
                ...tc,
                status: newStatus,
                actualResult: actualResultText,
                note: failureReason || tc.note || null
            };
            return updatedCase;
        }
        return tc;
    });

    saveAllTestCases(updatedCases);
    return updatedCase;
};

/**
 * Reconciles failed execution records into distinct unique defects.
 * Groups occurrences by stable fingerprint (testCaseId, endpoint, title, expected, actual).
 */
export const reconcileDefectsFromExecutions = (executionsList = null) => {
    const executions = executionsList || getTestingHistory();
    const failedExecs = executions.filter(e => e.status === 'FAIL');
    const defectGroupMap = new Map();

    failedExecs.forEach(exec => {
        const tcId = exec.testCaseId || '';
        const title = exec.bugTitle || exec.description || exec.question || 'Validation Defect';
        const expected = exec.expectedBehavior || exec.expectedStatus || 'HTTP 400 Bad Request';
        const actual = exec.actualBehavior || exec.actualStatus || exec.httpStatus || 'HTTP 200 OK';
        const endpoint = exec.endpoint || exec.target || '/api/messages';
        const method = exec.method || 'POST';

        // Stable defect fingerprint key (does NOT use Execution ID)
        const fingerprintKey = tcId ? tcId : `${method}_${endpoint}_${title}_${expected}_${actual}`;

        const execId = exec.id || exec.executionId || `EXEC-${Date.now()}`;
        const execTime = exec.timestamp || exec.date || new Date().toLocaleString();

        if (defectGroupMap.has(fingerprintKey)) {
            const existing = defectGroupMap.get(fingerprintKey);
            existing.occurrences += 1;
            if (!existing.relatedExecutions.includes(execId)) {
                existing.relatedExecutions.push(execId);
            }
            existing.lastDetectedAt = execTime;
            if (exec.responseBody && exec.responseBody !== 'N/A') {
                existing.responseBody = typeof exec.responseBody === 'object' ? JSON.stringify(exec.responseBody) : exec.responseBody;
            }
        } else {
            const bugIndex = defectGroupMap.size + 1;
            defectGroupMap.set(fingerprintKey, {
                id: `BUG-10${bugIndex < 10 ? '0' + bugIndex : bugIndex}`,
                testCaseId: tcId || `TC-00${bugIndex}`,
                executionId: execId,
                title: title,
                description: exec.bugDescription || `The API returned ${actual} instead of expected ${expected}.`,
                severity: tcId === 'TC-004' ? 'CRITICAL' : tcId === 'TC-002' ? 'HIGH' : 'MEDIUM',
                expectedBehavior: expected,
                actualBehavior: actual,
                httpStatus: exec.httpStatus || exec.httpCode || actual,
                responseBody: typeof exec.responseBody === 'object' ? JSON.stringify(exec.responseBody) : (exec.responseBody || '{"status": "success"}'),
                status: 'Open',
                occurrences: 1,
                relatedExecutions: [execId],
                detectedAt: execTime,
                lastDetectedAt: execTime
            });
        }
    });

    const uniqueDefects = Array.from(defectGroupMap.values());
    localStorage.setItem(STORAGE_KEY_BUGS, JSON.stringify(uniqueDefects));
    return uniqueDefects;
};

/**
 * Gets current active deduplicated Defects & Bugs.
 * Always reconciles execution history to ensure exact deduplication.
 */
export const getBugs = () => {
    return reconcileDefectsFromExecutions();
};

/**
 * Reconciles defect occurrences when a new failed test run is recorded.
 */
export const addBug = (newBug) => {
    const updatedDefects = reconcileDefectsFromExecutions();
    window.dispatchEvent(new Event('qa_test_cases_updated'));
    return updatedDefects;
};

/**
 * Resets dataset to baseline initial definitions
 */
export const resetTestCasesToBaseline = () => {
    const seedBugs = reconcileDefectsFromExecutions();
    localStorage.setItem(STORAGE_KEY_TEST_CASES, JSON.stringify(initialTestCasesData));
    window.dispatchEvent(new Event('qa_test_cases_updated'));
    return initialTestCasesData;
};
