import axios from 'axios';
import { getWebhookConfig } from '../config/webhookConfig';

/**
 * Parses and evaluates the actual QA Test Result returned by MicroMind Webhook response content.
 * 
 * CONCEPT SEPARATION:
 * A) Webhook Execution Status: Did the HTTP POST call to the webhook endpoint complete (HTTP 200 OK)?
 * B) QA Test Result: Did the actual API test PASS, FAIL, or is the result UNAVAILABLE?
 */
export const parseQATestResult = (rawOutput) => {
    if (rawOutput === null || rawOutput === undefined) {
        return {
            status: 'UNAVAILABLE',
            resultText: 'Result unavailable',
            isPass: false,
            isFail: false,
            isUnavailable: true,
            testDescription: 'API Test Scenario',
            expectedStatus: 'Not provided',
            actualStatus: 'Not provided',
            responseTime: 'Not provided',
            bugDescription: null,
            totalTests: 0,
            passed: 0,
            failed: 0,
            bugs: 0
        };
    }

    let payload = rawOutput;
    let textString = typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput);

    // Handle n8n / Flowise array wrapper output e.g. [{ json: { ... } }] or [{ output: "..." }]
    if (Array.isArray(payload) && payload.length > 0) {
        if (payload[0]?.json) {
            payload = payload[0].json;
        } else if (payload[0]?.output) {
            payload = payload[0].output;
        } else {
            payload = payload[0];
        }
    } else if (payload?.data && typeof payload.data === 'object') {
        payload = payload.data;
    } else if (payload?.output && typeof payload.output === 'object') {
        payload = payload.output;
    }

    if (typeof payload === 'string') {
        textString = payload;
        try {
            const parsed = JSON.parse(payload);
            payload = parsed;
            textString = JSON.stringify(parsed);
        } catch (e) {
            // Keep raw text string
        }
    } else if (typeof payload === 'object' && payload !== null) {
        textString = JSON.stringify(payload);
    }

    const textLower = textString.toLowerCase();

    // 1. EVALUATE EXPLICIT RESULT (PASS vs FAIL vs UNAVAILABLE)
    let explicitResult = null;

    if (typeof payload === 'object' && payload !== null) {
        const val = String(payload.result || payload.test_result || payload.testResult || payload.status || '').toUpperCase();
        if (val === 'FAIL' || val === 'FAILED') explicitResult = 'FAIL';
        else if (val === 'PASS' || val === 'PASSED') explicitResult = 'PASS';
    }

    if (!explicitResult) {
        const resMatch = textString.match(/Result:\s*(FAIL|PASS|FAILED|PASSED)/i) 
            || textString.match(/Status:\s*(FAIL|PASS|FAILED|PASSED)/i);
        if (resMatch) {
            const matchVal = resMatch[1].toUpperCase();
            explicitResult = (matchVal === 'FAIL' || matchVal === 'FAILED') ? 'FAIL' : 'PASS';
        }
    }

    // REQUIREMENT 3: Explicit Fail Indicators (FAIL, failed, bug, bug detected, expected result differs)
    const hasFailIndicators = 
        explicitResult === 'FAIL' ||
        /result:\s*fail/i.test(textString) ||
        /\bfail\b/i.test(textString) ||
        /\bfailed\b/i.test(textString) ||
        /\bbug\b/i.test(textString) ||
        /bug detected/i.test(textString) ||
        /bug description/i.test(textString) ||
        /expected result differs/i.test(textString) ||
        /accepted an empty message instead of returning/i.test(textString);

    const hasExplicitPassIndicators =
        explicitResult === 'PASS' ||
        /result:\s*pass/i.test(textString) ||
        /status:\s*pass/i.test(textString) ||
        /\bpassed\b/i.test(textString) ||
        /all tests passed/i.test(textString);

    // REQUIREMENT 4 & 6: Do NOT infer PASS from HTTP 200 webhook response or "status": "received".
    // If webhook does not provide enough information to determine PASS/FAIL, set status to 'UNAVAILABLE'.
    let finalStatus = 'UNAVAILABLE';

    if (hasFailIndicators) {
        finalStatus = 'FAIL';
    } else if (hasExplicitPassIndicators && !hasFailIndicators) {
        finalStatus = 'PASS';
    } else {
        finalStatus = 'UNAVAILABLE';
    }

    // 2. EXTRACT TEST DESCRIPTION
    let testDesc = null;
    if (typeof payload === 'object' && payload !== null) {
        testDesc = payload.test || payload.test_description || payload.testDescription || payload.scenario || payload.description || payload.name;
    }
    if (!testDesc) {
        const m = textString.match(/Test:\s*(.+)/i) || textString.match(/Scenario:\s*(.+)/i);
        if (m) testDesc = m[1].trim();
    }

    // 3. EXTRACT EXPECTED STATUS CODE (Do not invent if missing)
    let expectedStatus = null;
    if (typeof payload === 'object' && payload !== null) {
        expectedStatus = payload.expected_status_code || payload.expectedStatusCode || payload.expected_status || payload.expectedStatus || payload.expected;
    }
    if (!expectedStatus) {
        const m = textString.match(/Expected status code:\s*(.+)/i) || textString.match(/Expected status:\s*(.+)/i) || textString.match(/Expected:\s*(.+)/i);
        if (m) expectedStatus = m[1].trim();
    }

    // 4. EXTRACT ACTUAL STATUS CODE (Requirement 7: If not provided, display "Not provided")
    let actualStatus = null;
    if (typeof payload === 'object' && payload !== null) {
        actualStatus = payload.actual_status_code || payload.actualStatusCode || payload.actual_status || payload.actualStatus || payload.actual || payload.httpCode;
    }
    if (!actualStatus) {
        const m = textString.match(/Actual status code:\s*(.+)/i) || textString.match(/Actual status:\s*(.+)/i) || textString.match(/Actual:\s*(.+)/i);
        if (m) actualStatus = m[1].trim();
    }
    if (!actualStatus || String(actualStatus).toLowerCase().includes('not provided') || String(actualStatus).trim() === '') {
        actualStatus = 'Not provided';
    }

    // 5. EXTRACT RESPONSE TIME (Requirement 7: If not provided, display "Not provided")
    let responseTime = null;
    if (typeof payload === 'object' && payload !== null) {
        responseTime = payload.response_time || payload.responseTime || payload.time_ms || payload.timeMs || payload.time;
    }
    if (!responseTime) {
        const m = textString.match(/Response time:\s*(.+)/i) || textString.match(/Latency:\s*(.+)/i) || textString.match(/Time:\s*(.+)/i);
        if (m) responseTime = m[1].trim();
    }
    if (!responseTime || String(responseTime).toLowerCase().includes('not provided') || String(responseTime).trim() === '') {
        responseTime = 'Not provided';
    }

    // 6. EXTRACT BUG DESCRIPTION
    let bugDescription = null;
    if (typeof payload === 'object' && payload !== null) {
        bugDescription = payload.bug_description || payload.bugDescription || payload.bug_details || payload.bug || payload.defect;
    }
    if (!bugDescription) {
        const m = textString.match(/Bug description:\s*(.+)/i) || textString.match(/Bug:\s*(.+)/i) || textString.match(/Defect:\s*(.+)/i);
        if (m) bugDescription = m[1].trim();
    }

    const isFail = finalStatus === 'FAIL';
    const isPass = finalStatus === 'PASS';
    const isUnavailable = finalStatus === 'UNAVAILABLE';

    const totalTests = (isPass || isFail) ? 1 : 0;
    const passed = isPass ? 1 : 0;
    const failed = isFail ? 1 : 0;
    const bugs = (isFail || bugDescription) ? 1 : 0;

    const resultObject = {
        ...(typeof payload === 'object' && payload !== null ? payload : {}),
        raw: rawOutput,
        rawText: textString,
        requirement_understanding: (typeof payload === 'object' && payload !== null ? (payload.requirement_understanding || payload.requirementUnderstanding || payload.objective || payload.summary) : null) || testDesc,
        test_cases: (typeof payload === 'object' && payload !== null ? (payload.test_cases || payload.testCases || payload.scenarios || payload.cases) : null),
        expected_status_code: expectedStatus,
        actual_status_code: actualStatus,
        response_time: responseTime,
        status: finalStatus,
        resultText: isUnavailable ? 'Result unavailable' : finalStatus,
        isPass,
        isFail,
        isUnavailable,
        testDescription: testDesc || 'API Test Scenario',
        expectedStatus: expectedStatus || (isFail ? '400 Bad Request' : 'HTTP Status Code'),
        actualStatus,
        responseTime,
        bugDescription,
        totalTests,
        passed,
        failed,
        bugs
    };

    // REQUIREMENT 10: Development logging of raw webhook response and parsed QA result
    if (import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
        console.log('🤖 Raw MicroMind Webhook Response:', rawOutput);
        console.log('📊 Parsed QA Result:', resultObject);
    }

    return resultObject;
};

/**
 * Backward compatible alias for normalizeQAResponse
 */
export const normalizeQAResponse = (rawOutput) => {
    return parseQATestResult(rawOutput);
};

/**
 * Sends a requirement analysis request to the external AI QA Webhook.
 * @param {string} requirement - Software requirement entered by user
 * @param {Object} options - Custom options (cancelToken, explicitUrl, endpoint, method)
 */
export const analyzeRequirementWithWebhook = async (requirement, options = {}) => {
    const config = getWebhookConfig();
    let webhookUrl = options.explicitUrl || config.url;

    // Fallback if unconfigured or empty string
    if (!webhookUrl || webhookUrl.trim() === '') {
        webhookUrl = import.meta.env.VITE_QA_WEBHOOK_URL || 'https://core.aimicromind.com/webhook/61ed0540-8d82-41e9-aeb6-2ecc7b6fb1b8/webhook';
    }

    // REQUIREMENT: Method must be ONLY 'GET' or 'POST'
    const cleanMethod = (options.method || 'POST').toUpperCase() === 'GET' ? 'GET' : 'POST';

    const payloadBody = {
        requirement,
        endpoint: options.endpoint || '/api/messages',
        method: cleanMethod,
        data: {
            requirement,
            endpoint: options.endpoint || '/api/messages',
            method: cleanMethod
        }
    };

    try {
        const response = await axios.post(
            webhookUrl,
            payloadBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...config.headers,
                    ...(options.headers || {}),
                },
                timeout: options.timeout || 30000,
                cancelToken: options.cancelToken,
            }
        );

        if (!response.data) {
            throw new Error('Webhook returned empty response body.');
        }

        // Parse and return evaluated QA Test Result
        return parseQATestResult(response.data);
    } catch (err) {
        if (axios.isCancel(err)) {
            const cancelErr = new Error('Analysis request was cancelled.');
            cancelErr.code = 'CANCELLED';
            throw cancelErr;
        }

        console.error('⚠️ MicroMind Webhook Execution Error:', err);

        let customErrorMsg = err.message || 'Failed to connect to AI QA Webhook API.';
        let statusCode = err.response?.status;

        if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
            customErrorMsg = 'Webhook request timed out (30s). The MicroMind AI workflow is taking longer than expected.';
            statusCode = 408;
        } else if (err.code === 'ERR_NETWORK' || !err.response) {
            customErrorMsg = `Network Error: Unable to connect to MicroMind Webhook endpoint at "${webhookUrl}". Check your connection or CORS settings.`;
            statusCode = 0;
        } else if (err.response?.status === 404) {
            customErrorMsg = `Endpoint Not Found (404): The webhook URL "${webhookUrl}" does not exist.`;
        } else if (err.response?.status === 401 || err.response?.status === 403) {
            customErrorMsg = `Authentication Failed (${err.response.status}): Check your Webhook Headers / API Key.`;
        } else if (err.response?.status >= 500) {
            customErrorMsg = `Server Error (${err.response.status}): The MicroMind AI QA workflow encountered an internal error.`;
        }

        const formattedErr = new Error(customErrorMsg);
        formattedErr.statusCode = statusCode;
        formattedErr.url = webhookUrl;
        formattedErr.originalError = err;
        throw formattedErr;
    }
};

/**
 * Pings webhook to test connection status.
 */
export const testWebhookConnection = async (url, headers = {}) => {
    try {
        const response = await axios.post(
            url,
            { requirement: 'Ping health check test', method: 'GET', endpoint: '/api/health' },
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                timeout: 10000,
            }
        );
        return {
            success: true,
            status: response.status,
            message: `Connection successful (${response.status} OK)`,
            data: response.data,
        };
    } catch (err) {
        return {
            success: false,
            status: err.response?.status || 0,
            message: err.message || 'Connection test failed',
        };
    }
};
