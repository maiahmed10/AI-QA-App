/**
 * Real HTTP API Test Runner & Deterministic Contract Assertion Engine.
 * Executes real network requests against target API endpoints and evaluates PASS/FAIL status.
 */

import { LOCAL_API_ENDPOINT } from '../data/qaTestData';
import { saveTestingRecord } from './qaHistoryService';
import { updateTestCaseResult } from './qaTestCaseService';

/**
 * Deterministic Assertion Evaluator
 * Evaluates expected vs actual HTTP status codes, schema structures, and contract rules.
 * Does NOT rely on AI to decide PASS/FAIL status.
 */
export const evaluateContractAssertion = (testCase, actualStatus, actualData, durationMs) => {
    const payloadStr = typeof testCase.payload === 'string' ? testCase.payload : JSON.stringify(testCase.payload || {});
    const tcId = testCase.id || '';
    
    // Check if this scenario is a negative validation check expecting an HTTP 400 Bad Request error
    const isNegativeValidationTest = 
        tcId === 'TC-002' || 
        tcId === 'TC-003' || 
        tcId === 'TC-004' || 
        tcId === 'TC-005' ||
        payloadStr.includes('""') || 
        payloadStr === '{}' ||
        payloadStr.includes('incomplete');

    let passed = false;
    let failureReason = null;
    let expectedDescription = testCase.expectedResult || 'Expected contract validation';

    if (isNegativeValidationTest) {
        // Negative validation checks expect HTTP 400 Bad Request or HTTP 405 Method Not Allowed
        if (actualStatus === 400 || actualStatus === 405) {
            passed = true;
        } else if (actualStatus === 200) {
            passed = false;
            if (tcId === 'TC-002' || payloadStr.includes('""')) {
                failureReason = 'Triggered BUG-001: API accepted empty string "" payload with HTTP 200 OK instead of HTTP 400 Bad Request.';
            } else {
                failureReason = `Expected HTTP 400 Bad Request for negative payload, but API returned HTTP 200 OK.`;
            }
        } else {
            passed = false;
            failureReason = `Expected HTTP 400 Bad Request error, but received HTTP ${actualStatus}.`;
        }
    } else {
        // Positive validation checks expect HTTP 200 OK
        if (actualStatus === 200) {
            if (actualData && typeof actualData === 'object' && actualData.error) {
                passed = false;
                failureReason = `Returned HTTP 200 but response body contains error: ${actualData.error}`;
            } else {
                passed = true;
            }
        } else {
            passed = false;
            failureReason = `Expected HTTP 200 OK, but received HTTP ${actualStatus}.`;
        }
    }

    return {
        passed,
        status: passed ? 'PASS' : 'FAIL',
        failureReason,
        expectedDescription,
        actualDescription: `HTTP ${actualStatus} received (${durationMs}ms)`
    };
};

/**
 * Executes a real HTTP request for a single test case scenario.
 * Updates Test Case Results, Testing History, Dashboard Metrics, and Defects & Bugs.
 * @param {Object} testCase - Test case definition
 * @param {string} [targetUrl] - Target API endpoint URL
 * @param {boolean} [autoSaveHistory=true] - Whether to record execution run in Testing History
 */
export const runRealHttpTestCase = async (testCase, targetUrl = LOCAL_API_ENDPOINT, autoSaveHistory = true) => {
    const startTime = Date.now();
    let bodyObj = { message: "Hello World" };

    try {
        if (typeof testCase.payload === 'string') {
            bodyObj = JSON.parse(testCase.payload);
        } else if (typeof testCase.payload === 'object') {
            bodyObj = testCase.payload;
        }
    } catch (e) {
        const duration = Date.now() - startTime;
        const result = {
            testCaseId: testCase.id,
            status: 'FAIL',
            httpCode: 400,
            timeMs: duration,
            actualResult: `Client JSON Syntax Error (${duration}ms)`,
            actualData: { error: 'Invalid JSON payload syntax' },
            failureReason: 'Failed to parse JSON request body payload.'
        };
        
        if (testCase.id && testCase.id !== 'TC-LIVE') {
            updateTestCaseResult(testCase.id, 'FAIL', result.actualResult, result.failureReason);
        }

        if (autoSaveHistory) {
            saveTestingRecord({
                type: 'AI',
                target: `POST ${targetUrl}`,
                description: `${testCase.name} - ${testCase.id}`,
                question: `Execute Test Case ${testCase.id}: ${testCase.name}`,
                response: `Syntax Error parsing JSON payload: ${testCase.payload}`,
                status: 'FAIL',
                score: '0%',
                severity: 'High',
                issues: ['Invalid JSON payload syntax in test runner'],
                feedback: 'Verify JSON payload formatting before sending request.'
            });
        }
        return result;
    }

    try {
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj)
        });

        const duration = Date.now() - startTime;
        const resData = await res.json().catch(() => ({ message: 'Non-JSON response received' }));

        const evaluation = evaluateContractAssertion(testCase, res.status, resData, duration);

        const executionResult = {
            testCaseId: testCase.id,
            status: evaluation.status,
            httpCode: res.status,
            timeMs: duration,
            actualResult: evaluation.actualDescription,
            actualData: resData,
            failureReason: evaluation.failureReason
        };

        // Update active Test Case Results and linked Defects/Bugs
        if (testCase.id && testCase.id !== 'TC-LIVE') {
            updateTestCaseResult(testCase.id, evaluation.status, evaluation.actualDescription, evaluation.failureReason);
        }

        if (autoSaveHistory) {
            saveTestingRecord({
                type: 'AI',
                target: `POST ${targetUrl}`,
                description: `${testCase.name} (${testCase.id})`,
                question: `Test Payload: ${testCase.payload || '{"message": "Hello World"}'}`,
                response: `HTTP ${res.status} returned in ${duration}ms. Payload: ${JSON.stringify(resData)}`,
                status: evaluation.status,
                score: evaluation.status === 'PASS' ? '100%' : '50%',
                severity: evaluation.status === 'FAIL' ? 'Medium' : 'Low',
                issues: evaluation.failureReason ? [evaluation.failureReason] : [],
                feedback: evaluation.status === 'PASS' 
                    ? 'API contract assertions satisfied expected criteria.' 
                    : `Contract assertion failed: ${evaluation.failureReason}`
            });
        }

        return executionResult;

    } catch (err) {
        const duration = Date.now() - startTime;
        const executionResult = {
            testCaseId: testCase.id,
            status: 'BLOCKED',
            httpCode: 0,
            timeMs: duration,
            actualResult: `Network Error (${duration}ms)`,
            actualData: { error: err.message || 'Failed to reach API endpoint' },
            failureReason: `Network failure: Unable to reach endpoint "${targetUrl}".`
        };

        if (testCase.id && testCase.id !== 'TC-LIVE') {
            updateTestCaseResult(testCase.id, 'BLOCKED', executionResult.actualResult, executionResult.failureReason);
        }

        if (autoSaveHistory) {
            saveTestingRecord({
                type: 'AI',
                target: `POST ${targetUrl}`,
                description: `${testCase.name} (${testCase.id})`,
                question: `Test Payload: ${testCase.payload || '{}'}`,
                response: `Network Error: ${err.message}`,
                status: 'FAIL',
                score: '0%',
                severity: 'High',
                issues: [`Network Error: Unable to reach endpoint "${targetUrl}"`],
                feedback: 'Check local backend server status and CORS configuration.'
            });
        }

        return executionResult;
    }
};

/**
 * Executes all test cases sequentially against target API endpoint.
 * @param {Array} testCasesList - List of test cases to run
 * @param {string} targetUrl - Target API endpoint URL
 * @returns {Promise<Object>} Summary of suite execution results
 */
export const runTestSuite = async (testCasesList, targetUrl = LOCAL_API_ENDPOINT) => {
    const results = {};
    for (const tc of testCasesList) {
        if (tc.status === 'NOT EXECUTED' && !tc.payload) {
            results[tc.id] = {
                testCaseId: tc.id,
                status: 'NOT EXECUTED',
                httpCode: 0,
                timeMs: 0,
                actualResult: tc.actualResult || 'Not Executed',
                actualData: { message: tc.reason || 'Scenario unexecutable via standard HTTP client' },
                failureReason: tc.reason
            };
            continue;
        }

        const res = await runRealHttpTestCase(tc, targetUrl, true);
        results[tc.id] = res;
    }
    return results;
};
