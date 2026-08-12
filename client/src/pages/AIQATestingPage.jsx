import React, { useState } from 'react';
import { analyzeRequirementWithWebhook } from '../services/qaWebhookService';
import { saveTestingRecord } from '../services/qaHistoryService';
import { addBug, addTestCase } from '../services/qaTestCaseService';
import { LOCAL_API_ENDPOINT } from '../data/qaTestData';
import {
    Cpu,
    Zap,
    Terminal,
    RefreshCw,
    Play,
    AlertCircle,
    Bug,
    CheckSquare,
    Square,
    ListChecks,
    Info
} from 'lucide-react';
import './AIQATestingPage.css';

/**
 * Helper to determine expected behavior and test type specifically for GET requests.
 */
const deriveGetTestDetails = (endpoint = '', requirementText = '') => {
    const epLower = (endpoint || '').toLowerCase();
    const reqLower = (requirementText || '').toLowerCase();

    const hasNonExistentId = /\/(999+|invalid|non-?existent|unknown|fake|null|undefined|000+)/i.test(endpoint);
    const isNegativeReq = reqLower.includes('invalid') || reqLower.includes('non-existent') || reqLower.includes('not found') || reqLower.includes('404') || reqLower.includes('missing') || reqLower.includes('reject') || reqLower.includes('bad id') || reqLower.includes('fake');

    const isNegative = hasNonExistentId || isNegativeReq;

    if (isNegative) {
        return {
            testType: 'Negative',
            expectedBehavior: 'HTTP 404 Not Found'
        };
    }

    return {
        testType: 'Positive',
        expectedBehavior: 'HTTP 200 OK and valid response data'
    };
};

const AIQATestingPage = () => {
    // 1. Test Requirement State
    const [requirementText, setRequirementText] = useState(
        'Fetch product details by ID and return HTTP 404 Not Found for non-existent products.'
    );

    // 2. API Configuration State (ONLY Endpoint, Method, Body)
    const [apiEndpoint, setApiEndpoint] = useState('https://dummyjson.com/products/999999999');
    const [httpMethod, setHttpMethod] = useState('GET'); // Strictly ONLY 'GET' or 'POST'
    const [requestBodyText, setRequestBodyText] = useState('{\n  "message": ""\n}');

    // 3. AI Test Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);

    // 4. Generated Test Cases & Selection State
    const [generatedTestCases, setGeneratedTestCases] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    // 5 & 6. Execution & Results State
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResults, setExecutionResults] = useState(null);

    // SECTION 2: Analyze Requirement Handler
    const handleAnalyzeRequirement = async (e) => {
        if (e) e.preventDefault();
        if (!requirementText.trim() || !apiEndpoint.trim()) return;

        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisData(null);
        setGeneratedTestCases([]);
        setSelectedIds([]);
        setExecutionResults(null);

        try {
            const prompt = `Test Requirement: ${requirementText}\nEndpoint: ${apiEndpoint}\nMethod: ${httpMethod}\nRequest Body: ${httpMethod === 'POST' ? requestBodyText : 'N/A'}`;

            const webhookAnalysis = await analyzeRequirementWithWebhook(prompt, {
                endpoint: apiEndpoint,
                method: httpMethod
            });

            let isNegative = false;
            let expectedBehaviorText = '';
            let testType = 'Positive';

            if (httpMethod === 'GET') {
                const getDetails = deriveGetTestDetails(apiEndpoint, requirementText);
                isNegative = getDetails.testType === 'Negative';
                testType = getDetails.testType;
                expectedBehaviorText = getDetails.expectedBehavior;
            } else {
                isNegative = requirementText.toLowerCase().includes('reject') || requirementText.toLowerCase().includes('400') || requestBodyText.includes('""');
                testType = isNegative ? 'Negative' : 'Positive';
                expectedBehaviorText = webhookAnalysis.expected_status_code || (isNegative ? 'HTTP 400 Bad Request' : 'HTTP 200 OK');
            }

            setAnalysisData({
                testObjective: webhookAnalysis.requirement_understanding || `Verify that ${httpMethod} ${apiEndpoint} handles the requirement correctly.`,
                testType: testType,
                preconditions: `Target API endpoint ${apiEndpoint} is reachable over ${httpMethod}.`,
                testData: httpMethod === 'POST' ? requestBodyText : 'None (GET Request)',
                expectedBehavior: expectedBehaviorText,
                raw: webhookAnalysis
            });

        } catch (err) {
            console.error('Analysis Error:', err);
            setAnalysisError(err.message || 'Failed to analyze requirement with MicroMind AI Webhook.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // SECTION 3: Generate Test Cases Handler
    const handleGenerateTestCases = () => {
        if (!analysisData) return;

        let cases = [];

        if (httpMethod === 'GET') {
            const getDetails = deriveGetTestDetails(apiEndpoint, requirementText);
            const isNegativeGet = getDetails.testType === 'Negative';

            if (isNegativeGet) {
                const validEndpoint = apiEndpoint.replace(/\/(999+|invalid|non-?existent|unknown|fake).*/i, '/1');
                cases = [
                    {
                        id: 'TC-006',
                        description: `GET ${apiEndpoint} — Non-Existent Resource Retrieval`,
                        type: 'Negative',
                        requestMethod: 'GET',
                        endpoint: apiEndpoint,
                        requestData: 'None',
                        expectedResult: 'HTTP 404 Not Found'
                    },
                    {
                        id: 'TC-005',
                        description: `GET ${validEndpoint} — Valid Resource Standard Retrieval`,
                        type: 'Positive',
                        requestMethod: 'GET',
                        endpoint: validEndpoint,
                        requestData: 'None',
                        expectedResult: 'HTTP 200 OK and valid response data'
                    }
                ];
            } else {
                const invalidEndpoint = apiEndpoint.includes('/products') 
                    ? apiEndpoint.replace(/\/products(\/\d+)?$/, '/products/999999999')
                    : (apiEndpoint.endsWith('/') ? `${apiEndpoint}999999999` : `${apiEndpoint}/999999999`);

                cases = [
                    {
                        id: 'TC-005',
                        description: `GET ${apiEndpoint} — Valid Existing Resource Retrieval`,
                        type: 'Positive',
                        requestMethod: 'GET',
                        endpoint: apiEndpoint,
                        requestData: 'None',
                        expectedResult: 'HTTP 200 OK and valid response data'
                    },
                    {
                        id: 'TC-006',
                        description: `GET ${invalidEndpoint} — Non-Existent Resource Edge Case`,
                        type: 'Negative',
                        requestMethod: 'GET',
                        endpoint: invalidEndpoint,
                        requestData: 'None',
                        expectedResult: 'HTTP 404 Not Found'
                    }
                ];
            }
        } else {
            const isNegative = requirementText.toLowerCase().includes('reject') || requirementText.toLowerCase().includes('400') || requestBodyText.includes('""');
            cases = [
                {
                    id: 'TC-001',
                    description: `POST ${apiEndpoint} — ${requirementText.slice(0, 45)}`,
                    type: isNegative ? 'Negative' : 'Positive',
                    requestMethod: 'POST',
                    endpoint: apiEndpoint,
                    requestData: requestBodyText,
                    expectedResult: analysisData.expectedBehavior
                },
                {
                    id: 'TC-002',
                    description: `POST ${apiEndpoint} — Valid Standard Payload Pass`,
                    type: 'Positive',
                    requestMethod: 'POST',
                    endpoint: apiEndpoint,
                    requestData: '{\n  "message": "Valid test message payload"\n}',
                    expectedResult: 'HTTP 200 OK'
                },
                {
                    id: 'TC-003',
                    description: `POST ${apiEndpoint} — Empty Payload Edge Case Validation`,
                    type: 'Negative',
                    requestMethod: 'POST',
                    endpoint: apiEndpoint,
                    requestData: '{}',
                    expectedResult: 'HTTP 400 Bad Request'
                }
            ];
        }

        // Add generated test cases to unified Test Cases store
        cases.forEach(tc => {
            addTestCase({
                id: tc.id,
                description: tc.description,
                name: tc.description,
                type: tc.type,
                method: tc.requestMethod,
                endpoint: tc.endpoint,
                requestData: tc.requestData,
                expectedResult: tc.expectedResult
            });
        });

        setGeneratedTestCases(cases);
        setSelectedIds(cases.map(c => c.id));
    };

    // Selection Handlers
    const handleSelectAll = () => {
        setSelectedIds(generatedTestCases.map(c => c.id));
    };

    const handleDeselectAll = () => {
        setSelectedIds([]);
    };

    const handleToggleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // SECTION 5: Run Selected Tests Handler
    const handleRunSelectedTests = async () => {
        if (selectedIds.length === 0) return;

        setIsExecuting(true);
        setExecutionResults(null);

        try {
            const selectedCases = generatedTestCases.filter(c => selectedIds.includes(c.id));
            const results = [];

            for (const tc of selectedCases) {
                const startTime = Date.now();
                const execId = `EXEC-${Date.now().toString().slice(-4)}`;
                const prompt = `Test Case ${tc.id}: ${tc.description}\nMethod: ${tc.requestMethod}\nEndpoint: ${tc.endpoint}\nData: ${tc.requestData}\nExpected: ${tc.expectedResult}`;

                // 1. Call AI Webhook
                const webhookRes = await analyzeRequirementWithWebhook(prompt, {
                    endpoint: tc.endpoint,
                    method: tc.requestMethod
                });

                // 2. Perform live endpoint fetch
                let resStatus = null;
                let liveCode = null;
                let liveBody = null;
                let duration = null;

                try {
                    let bodyPayload = undefined;
                    if (tc.requestMethod === 'POST' && tc.requestData && tc.requestData !== 'None') {
                        try { bodyPayload = JSON.parse(tc.requestData); } catch (e) { bodyPayload = tc.requestData; }
                    }

                    const res = await fetch(tc.endpoint, {
                        method: tc.requestMethod,
                        headers: { 'Content-Type': 'application/json' },
                        body: tc.requestMethod === 'GET' ? undefined : (typeof bodyPayload === 'object' ? JSON.stringify(bodyPayload) : bodyPayload)
                    });

                    duration = Date.now() - startTime;
                    resStatus = res.status;
                    liveCode = `HTTP ${res.status} ${res.statusText || ''}`.trim();
                    liveBody = await res.json().catch(() => res.text().catch(() => null));
                } catch (e) {
                    // CORS or network fallback
                }

                const displayCode = liveCode || (webhookRes.actual_status_code !== 'Not provided' ? webhookRes.actual_status_code : 'Not provided');
                const displayTime = duration ? `${duration}ms` : (webhookRes.response_time !== 'Not provided' ? webhookRes.response_time : 'Not provided');

                // 3. Assertion Validation
                let isFail = false;
                const expectedIs404 = tc.expectedResult.includes('404');
                const expectedIs200 = tc.expectedResult.includes('200');

                if (expectedIs404) {
                    if (resStatus && resStatus !== 404) {
                        isFail = true;
                    } else if (!resStatus && (webhookRes.isFail || webhookRes.status === 'FAIL')) {
                        isFail = true;
                    }
                } else if (expectedIs200) {
                    if (resStatus && resStatus >= 400) {
                        isFail = true;
                    } else if (!resStatus && (webhookRes.isFail || webhookRes.status === 'FAIL')) {
                        isFail = true;
                    }
                } else {
                    if (webhookRes.isFail || webhookRes.status === 'FAIL') {
                        isFail = true;
                    }
                }

                const finalStatus = isFail ? 'FAIL' : 'PASS';
                const bugDesc = isFail 
                    ? `The endpoint ${tc.requestMethod} ${tc.endpoint} returned ${displayCode} which does not satisfy expected behavior (${tc.expectedResult}).`
                    : null;

                // Update Test Case status in store
                addTestCase({
                    id: tc.id,
                    description: tc.description,
                    name: tc.description,
                    type: tc.type,
                    method: tc.requestMethod,
                    endpoint: tc.endpoint,
                    requestData: tc.requestData,
                    expectedResult: tc.expectedResult,
                    status: finalStatus
                });

                // Create linked defect if failed
                let bugReport = null;
                if (isFail) {
                    bugReport = {
                        id: `BUG-${Date.now().toString().slice(-4)}`,
                        testCaseId: tc.id,
                        executionId: execId,
                        title: `Validation Defect on ${tc.id}`,
                        description: bugDesc,
                        severity: 'HIGH',
                        expectedBehavior: tc.expectedResult,
                        actualBehavior: displayCode,
                        httpStatusCode: displayCode,
                        responseBody: liveBody || webhookRes.raw,
                        status: 'Open'
                    };
                    addBug(bugReport);
                }

                // Record execution to unified Execution History
                saveTestingRecord({
                    id: execId,
                    executionId: execId,
                    testCaseId: tc.id,
                    description: tc.description,
                    question: tc.description,
                    method: tc.requestMethod,
                    endpoint: tc.endpoint,
                    target: `${tc.requestMethod} ${tc.endpoint}`,
                    requestData: tc.requestData,
                    expectedBehavior: tc.expectedResult,
                    expectedStatus: tc.expectedResult,
                    actualBehavior: displayCode,
                    actualStatus: displayCode,
                    status: finalStatus,
                    httpStatus: displayCode,
                    httpCode: displayCode,
                    responseBody: liveBody || webhookRes.raw,
                    response: liveBody || webhookRes.raw,
                    responseTime: displayTime,
                    timeMs: displayTime,
                    bugTitle: bugReport ? bugReport.title : null,
                    bugDescription: bugDesc
                });

                results.push({
                    tcId: tc.id,
                    description: tc.description,
                    type: tc.type,
                    status: finalStatus,
                    isPass: finalStatus === 'PASS',
                    isFail: isFail,
                    expectedBehavior: tc.expectedResult,
                    actualBehavior: isFail ? `Endpoint returned ${displayCode} instead of expected behavior.` : `Responded correctly with ${displayCode}.`,
                    httpCode: displayCode,
                    responseTime: displayTime,
                    responseBody: liveBody || webhookRes.raw,
                    bug: bugReport
                });
            }

            setExecutionResults(results);

        } catch (err) {
            console.error('Execution Error:', err);
            setAnalysisError(err.message || 'Execution error during test run.');
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="ai-qa-testing-page">
            {/* Page Header */}
            <header className="qa-workspace-header">
                <div className="qa-workspace-title-box">
                    <div className="qa-workspace-icon">
                        <Terminal size={26} />
                    </div>
                    <div>
                        <span className="qa-tag font-mono">MAIN QA CREATION INTERFACE</span>
                        <h1 className="qa-title">New QA Test Creation & Execution</h1>
                    </div>
                </div>
            </header>

            <form onSubmit={handleAnalyzeRequirement}>
                {/* 1. TEST REQUIREMENT SECTION */}
                <section className="qa-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="qa-card-header">
                        <div className="qa-header-group">
                            <span className="step-pill">SECTION 1</span>
                            <h3 className="qa-card-title">Test Requirement</h3>
                        </div>
                    </div>

                    <div className="qa-card-body">
                        <div className="qa-field-group">
                            <label className="qa-field-label">Test Requirement</label>
                            <textarea
                                value={requirementText}
                                onChange={(e) => setRequirementText(e.target.value)}
                                rows={3}
                                className="qa-textarea"
                                placeholder="Describe what you want to verify, for example: Fetch product details by ID and return HTTP 404 Not Found for non-existent products."
                                required
                            />
                        </div>
                    </div>
                </section>

                {/* 2. API CONFIGURATION SECTION */}
                <section className="qa-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="qa-card-header">
                        <div className="qa-header-group">
                            <span className="step-pill">SECTION 2</span>
                            <h3 className="qa-card-title">API Configuration</h3>
                        </div>
                    </div>

                    <div className="qa-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.2rem' }}>
                            <div className="qa-field-group">
                                <label className="qa-field-label">API Endpoint</label>
                                <input
                                    type="text"
                                    value={apiEndpoint}
                                    onChange={(e) => setApiEndpoint(e.target.value)}
                                    className="qa-input font-mono"
                                    placeholder="Enter API endpoint URL (e.g. https://dummyjson.com/products/999999999)..."
                                    required
                                />
                            </div>

                            <div className="qa-field-group">
                                <label className="qa-field-label">HTTP Method</label>
                                <select
                                    value={httpMethod}
                                    onChange={(e) => setHttpMethod(e.target.value)}
                                    className="qa-select-sm font-mono"
                                    style={{ padding: '0.65rem 1rem', width: '100%', fontSize: '0.9rem' }}
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                </select>
                            </div>
                        </div>

                        {/* Request Body */}
                        <div className="qa-field-group">
                            <label className="qa-field-label">
                                Request Body (JSON)
                                {httpMethod === 'GET' && <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>(Disabled for GET requests)</span>}
                            </label>
                            {httpMethod === 'GET' ? (
                                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#64748B', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Info size={16} />
                                    <span>Request body is disabled for <code>GET</code> requests.</span>
                                </div>
                            ) : (
                                <textarea
                                    value={requestBodyText}
                                    onChange={(e) => setRequestBodyText(e.target.value)}
                                    rows={3}
                                    className="qa-textarea font-mono"
                                    placeholder='{\n  "message": ""\n}'
                                />
                            )}
                        </div>

                        {/* ANALYZE BUTTON */}
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                            <button
                                type="submit"
                                className="qa-analyze-btn"
                                disabled={isAnalyzing || isExecuting}
                                style={{ width: 'auto', padding: '0.85rem 2rem', fontSize: '0.95rem' }}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw size={18} className="qa-spin" />
                                        <span>Analyzing Requirement...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} />
                                        <span>Analyze Requirement</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {analysisError && (
                            <div className="qa-error-banner" style={{ marginTop: '1rem' }}>
                                <AlertCircle size={20} />
                                <div>
                                    <div className="fw-bold">Requirement Analysis Error</div>
                                    <div>{analysisError}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </form>

            {/* AI TEST ANALYSIS DISPLAY */}
            {analysisData && (
                <section className="qa-card" style={{ borderLeft: '4px solid #6366F1', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.95)' }}>
                    <div className="qa-card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                        <div className="qa-header-group">
                            <Cpu size={20} className="text-indigo" />
                            <h3 className="qa-card-title">AI Test Analysis</h3>
                        </div>
                        <span className={`qa-badge ${analysisData.testType === 'Positive' ? 'badge-pass' : 'badge-fail'}`}>
                            {analysisData.testType}
                        </span>
                    </div>

                    <div className="qa-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <strong style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Test Objective</strong>
                                <span style={{ color: '#F8FAFC', fontSize: '0.9rem', lineHeight: 1.5 }}>{analysisData.testObjective}</span>
                            </div>
                            <div>
                                <strong style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Preconditions</strong>
                                <span style={{ color: '#CBD5E1', fontSize: '0.85rem' }}>{analysisData.preconditions}</span>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <strong style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Test Data</strong>
                                <pre className="font-mono" style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#34D399', margin: '0.3rem 0 0', maxHeight: '80px', overflowY: 'auto' }}>
                                    {analysisData.testData}
                                </pre>
                            </div>
                            <div>
                                <strong style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Expected Behavior</strong>
                                <span style={{ color: '#FBBF24', fontSize: '0.9rem', fontWeight: 600 }}>{analysisData.expectedBehavior}</span>
                            </div>
                        </div>
                    </div>

                    {/* GENERATE TEST CASES BUTTON */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="mm-btn-primary"
                            onClick={handleGenerateTestCases}
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', padding: '0.8rem 1.6rem', fontSize: '0.95rem' }}
                        >
                            <ListChecks size={18} />
                            <span>Generate Test Cases</span>
                        </button>
                    </div>
                </section>
            )}

            {/* GENERATED TEST CASES TABLE & SELECTION */}
            {generatedTestCases.length > 0 && (
                <section className="qa-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="qa-card-header">
                        <div className="qa-header-group">
                            <span className="step-pill">SECTION 4</span>
                            <h3 className="qa-card-title">Generated Test Cases ({generatedTestCases.length})</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="mm-btn-link font-mono"
                                style={{ fontSize: '0.8rem' }}
                            >
                                Select All
                            </button>
                            <span style={{ color: '#64748B' }}>|</span>
                            <button
                                type="button"
                                onClick={handleDeselectAll}
                                className="mm-btn-link font-mono"
                                style={{ fontSize: '0.8rem', color: '#94A3B8' }}
                            >
                                Deselect All
                            </button>
                            <span className="font-mono text-muted" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                ({selectedIds.length} Selected)
                            </span>
                        </div>
                    </div>

                    <div className="qa-table-wrapper">
                        <table className="qa-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '45px', textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={selectedIds.length === generatedTestCases.length ? handleDeselectAll : handleSelectAll}
                                            style={{ background: 'none', border: 'none', color: '#818CF8', cursor: 'pointer', padding: 0 }}
                                            title="Toggle Select All"
                                        >
                                            {selectedIds.length === generatedTestCases.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </button>
                                    </th>
                                    <th style={{ width: '100px' }}>Test Case ID</th>
                                    <th>Description</th>
                                    <th style={{ width: '90px' }}>Type</th>
                                    <th style={{ width: '90px' }}>Method</th>
                                    <th>Endpoint</th>
                                    <th>Request Data</th>
                                    <th>Expected Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generatedTestCases.map((tc) => {
                                    const isSelected = selectedIds.includes(tc.id);
                                    return (
                                        <tr key={tc.id} className={isSelected ? 'tr-selected' : ''}>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSelectRow(tc.id)}
                                                    style={{ background: 'none', border: 'none', color: isSelected ? '#818CF8' : '#64748B', cursor: 'pointer', padding: 0 }}
                                                >
                                                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>
                                            <td className="font-mono text-indigo fw-bold">{tc.id}</td>
                                            <td className="fw-semibold" style={{ color: '#F8FAFC' }}>{tc.description}</td>
                                            <td>
                                                <span className={`qa-badge ${tc.type === 'Positive' ? 'badge-pass' : 'badge-fail'}`}>
                                                    {tc.type}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="mm-method-pill font-mono">{tc.requestMethod}</span>
                                            </td>
                                            <td className="font-mono text-muted-fg" style={{ fontSize: '0.8rem' }}>{tc.endpoint}</td>
                                            <td className="font-mono text-muted-fg" style={{ fontSize: '0.8rem' }}>{tc.requestData}</td>
                                            <td className="text-muted-fg font-mono" style={{ fontSize: '0.85rem', color: tc.expectedResult.includes('404') ? '#F87171' : '#34D399' }}>{tc.expectedResult}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* RUN SELECTED TESTS BUTTON */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="mm-btn-primary"
                            onClick={handleRunSelectedTests}
                            disabled={isExecuting || selectedIds.length === 0}
                            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700 }}
                        >
                            {isExecuting ? (
                                <>
                                    <RefreshCw size={18} className="qa-spin" />
                                    <span>Executing {selectedIds.length} Selected Test(s)...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={18} />
                                    <span>Run Selected Tests ({selectedIds.length})</span>
                                </>
                            )}
                        </button>
                    </div>
                </section>
            )}

            {/* TEST EXECUTION RESULTS & BUG DETECTION DISPLAY */}
            {executionResults && (
                <section className="qa-card" style={{ marginTop: '1.5rem', background: 'rgba(15, 23, 42, 0.98)' }}>
                    <div className="qa-card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                        <div className="qa-header-group">
                            <Terminal size={20} className="text-indigo" />
                            <h3 className="qa-card-title">Test Execution Results ({executionResults.length})</h3>
                        </div>
                    </div>

                    <div className="qa-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {executionResults.map((res) => (
                            <div key={res.tcId} style={{ background: 'rgba(0, 0, 0, 0.4)', border: `1px solid ${res.isFail ? 'rgba(239, 68, 68, 0.4)' : res.isPass ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`, borderRadius: '10px', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <span className="font-mono text-indigo fw-bold">{res.tcId}</span>
                                        <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{res.description}</span>
                                    </div>
                                    <span className={`qa-badge ${res.isFail ? 'badge-fail' : res.isPass ? 'badge-pass' : 'badge-warn'}`}>
                                        {res.status}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.825rem', marginBottom: '0.65rem' }}>
                                    <div><strong style={{ color: '#94A3B8' }}>HTTP Status Code:</strong> <span className="font-mono" style={{ color: res.isFail ? '#F87171' : '#34D399', fontWeight: 700 }}>{res.httpCode}</span></div>
                                    <div><strong style={{ color: '#94A3B8' }}>Response Time:</strong> <span className="font-mono" style={{ color: '#CBD5E1' }}>{res.responseTime}</span></div>
                                    <div><strong style={{ color: '#94A3B8' }}>Expected Behavior:</strong> <span style={{ color: '#FBBF24' }}>{res.expectedBehavior}</span></div>
                                    <div><strong style={{ color: '#94A3B8' }}>Actual Behavior:</strong> <span style={{ color: res.isFail ? '#F87171' : '#34D399' }}>{res.actualBehavior}</span></div>
                                </div>

                                {res.responseBody && (
                                    <div style={{ marginTop: '0.4rem' }}>
                                        <strong style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Actual Response Body</strong>
                                        <pre className="font-mono" style={{ background: 'rgba(0, 0, 0, 0.6)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: '#34D399', margin: 0, maxHeight: '120px', overflowY: 'auto' }}>
                                            {typeof res.responseBody === 'string' ? res.responseBody : JSON.stringify(res.responseBody, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {/* BUG REPORT SECTION WHEN TEST FAILS */}
                                {res.bug && (
                                    <div style={{ marginTop: '0.85rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '1rem', borderRadius: '8px', color: '#F87171' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>
                                            <Bug size={18} />
                                            <span>Bug Detected: {res.bug.title}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#FECACA' }}>
                                            <div><strong>Bug ID:</strong> <span className="font-mono">{res.bug.id}</span></div>
                                            <div><strong>Severity:</strong> <span className="qa-badge badge-fail" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}>{res.bug.severity}</span></div>
                                            <div><strong>Test Case ID:</strong> <span className="font-mono">{res.bug.testCaseId}</span></div>
                                            <div><strong>Endpoint:</strong> <span className="font-mono">{res.bug.endpoint}</span></div>
                                            <div style={{ gridColumn: '1 / -1' }}><strong>Expected Behavior:</strong> {res.bug.expectedBehavior}</div>
                                            <div style={{ gridColumn: '1 / -1' }}><strong>Actual Behavior:</strong> {res.bug.actualBehavior}</div>
                                            <div style={{ gridColumn: '1 / -1' }}><strong>HTTP Status Code:</strong> <span className="font-mono">{res.bug.httpStatusCode}</span></div>
                                            <div style={{ gridColumn: '1 / -1' }}><strong>Bug Description:</strong> {res.bug.description}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default AIQATestingPage;
