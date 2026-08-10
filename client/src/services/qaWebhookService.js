import axios from 'axios';
import { getWebhookConfig } from '../config/webhookConfig';

/**
 * Normalizes and safely parses AI QA Webhook responses.
 * Handles various structure variations returned by n8n, Make, Flowise, or custom AI endpoints.
 */
export const normalizeQAResponse = (rawOutput) => {
    let payload = rawOutput;

    // Handle stringified JSON
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            // Raw text fallback
            return {
                requirement_understanding: rawOutput,
                functional_test_cases: [],
                negative_test_cases: [],
                edge_cases: [],
                missing_requirements: [],
                risks: [],
                improved_requirements: [],
            };
        }
    }

    // Handle n8n / Flowise array wrapper output e.g. [{ json: { ... } }] or { data: { ... } }
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

    // Helper to format steps into clean array of strings
    const parseSteps = (stepsInput) => {
        if (Array.isArray(stepsInput)) return stepsInput.map(String);
        if (typeof stepsInput === 'string') {
            return stepsInput
                .split(/\n|\d+\.\s+|\,\s*/)
                .map(s => s.trim())
                .filter(Boolean);
        }
        return ['Execute scenario according to test data specifications'];
    };

    // Helper to normalize test cases array
    const parseTestCases = (cases, prefix) => {
        if (!Array.isArray(cases)) return [];
        return cases.map((item, idx) => ({
            id: item.id || item.test_id || `${prefix}-${String(idx + 1).padStart(3, '0')}`,
            scenario: item.scenario || item.title || item.name || 'Test Scenario',
            steps: parseSteps(item.steps || item.test_steps || item.procedure),
            test_data: item.test_data || item.testData || item.data || 'N/A',
            expected_result: item.expected_result || item.expectedResult || item.expected || 'Expected successful validation',
        }));
    };

    // Helper to normalize risks
    const parseRisks = (risksList) => {
        if (!Array.isArray(risksList)) return [];
        return risksList.map(risk => {
            if (typeof risk === 'string') {
                return {
                    title: risk.split(':')[0] || 'Identified Risk',
                    level: 'Medium',
                    description: risk,
                    mitigation: 'Implement proper validation and error handling.',
                };
            }
            return {
                title: risk.title || risk.name || risk.risk || 'System Risk',
                level: risk.level || risk.severity || risk.impact || 'Medium',
                description: risk.description || risk.details || 'Potential system impact identified.',
                mitigation: risk.mitigation || risk.remediation || risk.recommendation || 'Apply defensive checks.',
            };
        });
    };

    // Helper to normalize strings list
    const parseStringList = (list) => {
        if (!Array.isArray(list)) {
            if (typeof list === 'string') {
                return list.split(/\n|\d+\.\s+/).map(s => s.trim()).filter(Boolean);
            }
            return [];
        }
        return list.map(item => typeof item === 'object' ? (item.description || item.text || item.title || JSON.stringify(item)) : String(item));
    };

    return {
        requirement_understanding: payload.requirement_understanding || payload.understanding || payload.summary || 'Requirement analyzed successfully.',
        functional_test_cases: parseTestCases(payload.functional_test_cases || payload.functionalTests || payload.functional_tests, 'TC-FUNC'),
        negative_test_cases: parseTestCases(payload.negative_test_cases || payload.negativeTests || payload.negative_tests, 'TC-NEG'),
        edge_cases: parseStringList(payload.edge_cases || payload.edgeCases),
        missing_requirements: parseStringList(payload.missing_requirements || payload.missingRequirements),
        risks: parseRisks(payload.risks || payload.risk_analysis),
        improved_requirements: parseStringList(payload.improved_requirements || payload.improvedRequirements),
    };
};

/**
 * Sends a requirement analysis request to the external AI QA Webhook.
 * @param {string} requirement - Software requirement entered by user
 * @param {Object} options - Custom options (cancelToken, explicitUrl)
 */
export const analyzeRequirementWithWebhook = async (requirement, options = {}) => {
    const config = getWebhookConfig();
    let webhookUrl = options.explicitUrl || config.url;

    // Fallback if unconfigured or empty string
    if (!webhookUrl || webhookUrl.trim() === '') {
        webhookUrl = 'http://localhost:3000/api/v1/ai/qa-analyze';
    }

    try {
        const response = await axios.post(
            webhookUrl,
            { requirement },
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

        return normalizeQAResponse(response.data);
    } catch (err) {
        if (axios.isCancel(err)) {
            const cancelErr = new Error('Analysis request was cancelled.');
            cancelErr.code = 'CANCELLED';
            throw cancelErr;
        }

        let customErrorMsg = err.message || 'Failed to connect to AI QA Webhook API.';
        let statusCode = err.response?.status;

        if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
            customErrorMsg = 'Webhook request timed out (90s). The AI model might still be processing.';
            statusCode = 408;
        } else if (err.code === 'ERR_NETWORK' || !err.response) {
            customErrorMsg = `Network / CORS Error: Unable to reach endpoint "${webhookUrl}". Please verify the URL is correct and accepts cross-origin requests.`;
            statusCode = 0;
        } else if (err.response?.status === 404) {
            customErrorMsg = `Endpoint Not Found (404): The webhook URL "${webhookUrl}" does not exist.`;
        } else if (err.response?.status === 401 || err.response?.status === 403) {
            customErrorMsg = `Authentication Failed (${err.response.status}): Check your Webhook Headers / API Token in settings.`;
        } else if (err.response?.status >= 500) {
            customErrorMsg = `Server Error (${err.response.status}): The AI QA workflow server encountered an internal error.`;
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
            { requirement: 'Ping health check test' },
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
