import React, { useState } from 'react';
import { analyzeRequirementWithWebhook } from '../services/qaWebhookService';
import { saveTestingRecord } from '../services/qaHistoryService';
import { LOCAL_API_ENDPOINT, API_ENDPOINT } from '../data/qaTestData';
import {
    Cpu,
    Zap,
    Upload,
    FileText,
    Trash2,
    Globe,
    Smartphone,
    Terminal,
    RefreshCw,
    Play,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Bug,
    ShieldAlert,
    Check,
    Layers,
    ArrowRight
} from 'lucide-react';
import './AIQATestingPage.css';

const AIQATestingPage = () => {
    // Mode State: 'api' | 'website' | 'app'
    const [testMode, setTestMode] = useState('api');

    // Step 1: Input State
    const [requirementText, setRequirementText] = useState(
        'Test POST /api/messages. The API accepts a required non-empty message. A valid message should return a successful response. An empty message should be rejected with a validation error.'
    );
    const [websiteUrl, setWebsiteUrl] = useState('https://example.com');
    const [appName, setAppName] = useState('MicroMind Mobile Companion App');
    const [uploadedFile, setUploadedFile] = useState(null); // { name, size, content }

    // Step 2: Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);

    // Step 4: Live Execution State for API Mode
    const [liveTargetUrl, setLiveTargetUrl] = useState(LOCAL_API_ENDPOINT);
    const [httpMethod, setHttpMethod] = useState('POST');
    const [executionMap, setExecutionMap] = useState({}); // { [tcId]: { status, httpCode, timeMs, responseBody, bug } }
    const [runningTcId, setRunningTcId] = useState(null);
    const [isRunningAll, setIsRunningAll] = useState(false);
    const [detectedBugs, setDetectedBugs] = useState([]);

    // File Upload Handler
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileObj = {
            name: file.name,
            sizeKb: (file.size / 1024).toFixed(1)
        };
        setUploadedFile(fileObj);

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            if (content) {
                setRequirementText(content);
            }
        };
        reader.readAsText(file);
    };

    // Remove Uploaded File Handler
    const handleRemoveFile = () => {
        setUploadedFile(null);
        setRequirementText('');
    };

    // Step 2: Analyze Requirement Action
    const handleAnalyze = async () => {
        const inputText = requirementText.trim() || (testMode === 'website' ? `Test website: ${websiteUrl}` : `Test app: ${appName}`);
        if (!inputText) return;

        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisData(null);
        setExecutionMap({});
        setDetectedBugs([]);

        try {
            // Build mode context prompt
            let modeContextReq = inputText;
            if (testMode === 'website') {
                modeContextReq = `[Web UI Spec for ${websiteUrl}]: ${inputText}`;
            } else if (testMode === 'app') {
                modeContextReq = `[Mobile App Spec for ${appName}]: ${inputText}`;
            }

            // Call MicroMind Core Webhook Integration
            const resultData = await analyzeRequirementWithWebhook(modeContextReq);
            setAnalysisData(resultData);

            // Automatically record run to Testing History
            saveTestingRecord({
                question: modeContextReq,
                response: typeof resultData.requirement_understanding === 'string' ? resultData.requirement_understanding : JSON.stringify(resultData),
                status: resultData.status || 'PASS',
                score: resultData.score || '95%',
                issues: resultData.issues || (resultData.risks?.map(r => r.title) || []),
                feedback: resultData.feedback || 'Requirement analyzed successfully with generated test cases.'
            });
        } catch (err) {
            console.error('AI QA Analyze Error:', err);
            setAnalysisError(err.message || 'Failed to complete requirement analysis from AI Webhook.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Helper to extract JSON body payload for API test cases
    const extractPayload = (tc) => {
        if (!tc) return { message: "Hello World" };
        const testDataStr = tc.test_data || '';
        const scenarioLower = (tc.scenario || '').toLowerCase();

        if (scenarioLower.includes('empty') || testDataStr.includes('""')) {
            return { message: "" };
        }
        if (scenarioLower.includes('missing') || testDataStr.includes('{}')) {
            return {};
        }
        if (scenarioLower.includes('non-string') || scenarioLower.includes('numeric') || testDataStr.includes('123')) {
            return { message: 123 };
        }
        if (scenarioLower.includes('special') || testDataStr.includes('!@#')) {
            return { message: "!@#$%^&*()_+-=[]{}|;':\",.<>?/~`" };
        }
        return { message: "Hello World" };
    };

    // Step 4: Run Single Live API Test
    const handleRunLiveTest = async (tc, tcType) => {
        setRunningTcId(tc.id);
        const startTime = Date.now();
        const payloadObj = extractPayload(tc);

        try {
            const res = await fetch(liveTargetUrl, {
                method: httpMethod,
                headers: { 'Content-Type': 'application/json' },
                body: httpMethod === 'GET' ? undefined : JSON.stringify(payloadObj)
            });

            const duration = Date.now() - startTime;
            const resBody = await res.json().catch(() => ({ error: 'Non-JSON response' }));

            let testStatus = 'PASS';
            let bugReport = null;

            const isNegative = tcType === 'negative' || (tc.scenario || '').toLowerCase().includes('empty') || (tc.scenario || '').toLowerCase().includes('missing');

            if (isNegative) {
                if (res.status === 200) {
                    testStatus = 'FAIL';
                    bugReport = {
                        id: `BUG-LIVE-${Date.now().toString().slice(-4)}`,
                        testCaseId: tc.id,
                        description: `Validation Defect: Payload "${JSON.stringify(payloadObj)}" accepted with HTTP 200 OK (Expected HTTP 400 Bad Request)`,
                        expectedResult: 'HTTP 400 Bad Request validation error',
                        actualResult: 'HTTP 200 OK (Accepted)',
                        severity: 'Medium',
                        status: 'Open'
                    };
                }
            } else {
                if (!res.ok) {
                    testStatus = 'FAIL';
                    bugReport = {
                        id: `BUG-LIVE-${Date.now().toString().slice(-4)}`,
                        testCaseId: tc.id,
                        description: `Functional Defect: Valid payload rejected with HTTP ${res.status}`,
                        expectedResult: 'HTTP 200 OK',
                        actualResult: `HTTP ${res.status} error`,
                        severity: 'High',
                        status: 'Open'
                    };
                }
            }

            const tcResult = {
                status: testStatus,
                httpCode: res.status,
                timeMs: duration,
                responseBody: resBody,
                executedPayload: payloadObj,
                bug: bugReport
            };

            setExecutionMap((prev) => ({ ...prev, [tc.id]: tcResult }));

            if (bugReport) {
                setDetectedBugs((prev) => {
                    if (prev.some((b) => b.testCaseId === tc.id)) return prev;
                    return [...prev, bugReport];
                });
            }
        } catch (err) {
            const duration = Date.now() - startTime;
            setExecutionMap((prev) => ({
                ...prev,
                [tc.id]: {
                    status: 'BLOCKED',
                    httpCode: 0,
                    timeMs: duration,
                    responseBody: { error: err.message || 'Network connection failed' },
                    executedPayload: payloadObj,
                    bug: null
                }
            }));
        } finally {
            setRunningTcId(null);
        }
    };

    return (
        <div className="ai-qa-testing-page">
            {/* Page Header */}
            <header className="qa-workspace-header">
                <div className="qa-workspace-title-box">
                    <div className="qa-workspace-icon">
                        <Cpu size={26} />
                    </div>
                    <div>
                        <span className="qa-tag font-mono">STEP 1 TO STEP 5 QA WORKSPACE</span>
                        <h1 className="qa-title">AI QA Testing Workspace</h1>
                    </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="qa-mode-tabs">
                    <button
                        className={`qa-mode-btn ${testMode === 'api' ? 'active' : ''}`}
                        onClick={() => setTestMode('api')}
                    >
                        <Terminal size={16} />
                        <span>API Testing</span>
                    </button>

                    <button
                        className={`qa-mode-btn ${testMode === 'website' ? 'active' : ''}`}
                        onClick={() => setTestMode('website')}
                    >
                        <Globe size={16} />
                        <span>Website Testing</span>
                    </button>

                    <button
                        className={`qa-mode-btn ${testMode === 'app' ? 'active' : ''}`}
                        onClick={() => setTestMode('app')}
                    >
                        <Smartphone size={16} />
                        <span>Application Testing</span>
                    </button>
                </div>
            </header>

            {/* STEP 1: Requirement Input */}
            <section className="qa-card">
                <div className="qa-card-header">
                    <div className="qa-header-group">
                        <span className="step-pill">STEP 1</span>
                        <h3 className="qa-card-title">
                            {testMode === 'api' && 'API Requirement Specification Input'}
                            {testMode === 'website' && 'Website UI Testing Specification Input'}
                            {testMode === 'app' && 'Application Testing Specification Input'}
                        </h3>
                    </div>
                    <span className="mode-pill font-mono">{testMode.toUpperCase()} MODE</span>
                </div>

                <div className="qa-card-body">
                    {/* Specific Mode Inputs */}
                    {testMode === 'website' && (
                        <div className="qa-field-group">
                            <label className="qa-field-label">Target Website URL:</label>
                            <input
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                className="qa-input font-mono"
                                placeholder="https://example.com"
                            />
                        </div>
                    )}

                    {testMode === 'app' && (
                        <div className="qa-field-group">
                            <label className="qa-field-label">Application Package / Spec Name:</label>
                            <input
                                type="text"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                className="qa-input"
                                placeholder="e.g. com.micromind.companion"
                            />
                        </div>
                    )}

                    {/* Textarea Requirement Input */}
                    <div className="qa-field-group">
                        <label className="qa-field-label">Software Requirement Text:</label>
                        <textarea
                            value={requirementText}
                            onChange={(e) => setRequirementText(e.target.value)}
                            rows={4}
                            className="qa-textarea"
                            placeholder="Enter software requirement description, user story, or API specification..."
                        />
                    </div>

                    {/* File Upload Option */}
                    <div className="qa-upload-toolbar">
                        <div className="qa-upload-actions">
                            <label className="qa-upload-button">
                                <Upload size={16} />
                                <span>Upload File (TXT, JSON, MD, DOC)</span>
                                <input
                                    type="file"
                                    accept=".txt,.json,.md,.doc,.docx"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>

                            {uploadedFile && (
                                <div className="qa-file-chip">
                                    <FileText size={15} className="text-gold" />
                                    <span>{uploadedFile.name} ({uploadedFile.sizeKb} KB)</span>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="qa-remove-file-btn"
                                        title="Remove File"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* STEP 2: Analyze Button */}
                        <button
                            type="button"
                            className="qa-analyze-btn"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || (!requirementText.trim() && !websiteUrl && !appName)}
                        >
                            {isAnalyzing ? (
                                <>
                                    <RefreshCw size={17} className="qa-spin" />
                                    <span>Analyzing Requirement...</span>
                                </>
                            ) : (
                                <>
                                    <Zap size={17} />
                                    <span>STEP 2: Analyze Requirement</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {analysisError && (
                    <div className="qa-error-banner">
                        <AlertCircle size={20} />
                        <div>
                            <div className="fw-bold">Webhook API Error</div>
                            <div>{analysisError}</div>
                        </div>
                    </div>
                )}
            </section>

            {/* STEP 2 Loading State */}
            {isAnalyzing && (
                <div className="qa-card qa-loading-box">
                    <RefreshCw size={36} className="qa-spin text-gold" style={{ margin: '0 auto 1rem' }} />
                    <h4 className="text-gold" style={{ margin: '0 0 0.5rem' }}>MicroMind AI Processing Requirement Webhook...</h4>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                        Generating structured test cases, type classifications, expected results, and risk assessment
                    </p>
                </div>
            )}

            {/* STEP 2 & STEP 3 Results: AI Analysis & Test Cases */}
            {analysisData && !isAnalyzing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* AI Scope Analysis */}
                    <section className="qa-card" style={{ borderLeft: '4px solid #E0AA3E' }}>
                        <div className="qa-header-group" style={{ marginBottom: '0.5rem' }}>
                            <Cpu size={18} className="text-gold" />
                            <h4 className="qa-card-title">AI Requirement Summary & Scope</h4>
                        </div>
                        <p style={{ color: '#DDD', margin: '0 0 1rem', lineHeight: 1.6, fontSize: '0.925rem' }}>
                            {analysisData.requirement_understanding}
                        </p>

                        {/* Analysis Badges & Risk Overview */}
                        <div className="qa-scope-tags">
                            <div className="qa-tag-item">
                                <span className="qa-tag-label">Testing Type:</span>
                                <span className="qa-tag-value font-mono">{testMode.toUpperCase()} TESTING</span>
                            </div>
                            <div className="qa-tag-item">
                                <span className="qa-tag-label">Functional Scenarios:</span>
                                <span className="qa-tag-value font-mono text-pass">
                                    {analysisData.functional_test_cases?.length || 0} Positive
                                </span>
                            </div>
                            <div className="qa-tag-item">
                                <span className="qa-tag-label">Negative Scenarios:</span>
                                <span className="qa-tag-value font-mono text-fail">
                                    {analysisData.negative_test_cases?.length || 0} Negative
                                </span>
                            </div>
                            <div className="qa-tag-item">
                                <span className="qa-tag-label">Identified Risks:</span>
                                <span className="qa-tag-value font-mono text-warn">
                                    {analysisData.risks?.length || 0} Areas
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* STEP 3: Generated Test Cases Table */}
                    <section className="qa-card">
                        <div className="qa-card-header">
                            <div className="qa-header-group">
                                <span className="step-pill">STEP 3</span>
                                <h3 className="qa-card-title">Generated Test Cases</h3>
                            </div>

                            {/* API Controls */}
                            {testMode === 'api' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <select
                                        value={httpMethod}
                                        onChange={(e) => setHttpMethod(e.target.value)}
                                        className="qa-select-sm font-mono"
                                    >
                                        <option value="POST">POST</option>
                                        <option value="GET">GET</option>
                                        <option value="PUT">PUT</option>
                                        <option value="DELETE">DELETE</option>
                                    </select>

                                    <select
                                        value={liveTargetUrl}
                                        onChange={(e) => setLiveTargetUrl(e.target.value)}
                                        className="qa-select-sm"
                                    >
                                        <option value={LOCAL_API_ENDPOINT}>Local API ({LOCAL_API_ENDPOINT})</option>
                                        <option value={API_ENDPOINT}>Public Tunnel ({API_ENDPOINT})</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Test Cases Table */}
                        <div className="qa-table-wrapper">
                            <table className="qa-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '95px' }}>ID</th>
                                        <th>Description</th>
                                        <th style={{ width: '130px' }}>Type</th>
                                        <th>Test Data</th>
                                        <th>Expected Result</th>
                                        <th style={{ width: '140px' }}>Execution Status</th>
                                        <th style={{ width: '130px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Functional Test Cases */}
                                    {(analysisData.functional_test_cases || []).map((tc) => {
                                        const resData = executionMap[tc.id];
                                        const isExecuting = runningTcId === tc.id;

                                        return (
                                            <tr key={tc.id} className={resData?.status === 'FAIL' ? 'tr-fail' : ''}>
                                                <td className="font-mono text-gold fw-bold">{tc.id}</td>
                                                <td>{tc.scenario}</td>
                                                <td>
                                                    <span className="qa-badge badge-pass">Positive</span>
                                                </td>
                                                <td className="font-mono text-muted-fg">
                                                    {JSON.stringify(extractPayload(tc))}
                                                </td>
                                                <td className="text-muted-fg">{tc.expected_result}</td>
                                                <td>
                                                    {testMode === 'api' ? (
                                                        resData ? (
                                                            <span className={`qa-badge ${resData.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                                                                {resData.status} ({resData.timeMs}ms)
                                                            </span>
                                                        ) : (
                                                            <span className="qa-badge badge-warn">READY</span>
                                                        )
                                                    ) : testMode === 'website' ? (
                                                        <span className="qa-badge badge-warn">BLOCKED</span>
                                                    ) : (
                                                        <span className="qa-badge badge-warn">BLOCKED</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {testMode === 'api' ? (
                                                        <button
                                                            className="qa-run-sm-btn"
                                                            onClick={() => handleRunLiveTest(tc, 'functional')}
                                                            disabled={isExecuting}
                                                        >
                                                            {isExecuting ? <RefreshCw size={13} className="qa-spin" /> : <Play size={13} />}
                                                            <span>Run Live Test</span>
                                                        </button>
                                                    ) : testMode === 'website' ? (
                                                        <span className="qa-blocked-text" title="Browser automation engine not connected">
                                                            No Engine
                                                        </span>
                                                    ) : (
                                                        <span className="qa-blocked-text" title="Mobile emulator or real device required">
                                                            No Device
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Negative Test Cases */}
                                    {(analysisData.negative_test_cases || []).map((tc) => {
                                        const resData = executionMap[tc.id];
                                        const isExecuting = runningTcId === tc.id;

                                        return (
                                            <tr key={tc.id} className={resData?.status === 'FAIL' ? 'tr-fail' : ''}>
                                                <td className="font-mono text-gold fw-bold">{tc.id}</td>
                                                <td>{tc.scenario}</td>
                                                <td>
                                                    <span className="qa-badge badge-fail">Negative</span>
                                                </td>
                                                <td className="font-mono text-muted-fg">
                                                    {JSON.stringify(extractPayload(tc))}
                                                </td>
                                                <td className="text-muted-fg">{tc.expected_result}</td>
                                                <td>
                                                    {testMode === 'api' ? (
                                                        resData ? (
                                                            <span className={`qa-badge ${resData.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                                                                {resData.status} ({resData.timeMs}ms)
                                                            </span>
                                                        ) : (
                                                            <span className="qa-badge badge-warn">READY</span>
                                                        )
                                                    ) : testMode === 'website' ? (
                                                        <span className="qa-badge badge-warn">BLOCKED</span>
                                                    ) : (
                                                        <span className="qa-badge badge-warn">BLOCKED</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {testMode === 'api' ? (
                                                        <button
                                                            className="qa-run-sm-btn"
                                                            onClick={() => handleRunLiveTest(tc, 'negative')}
                                                            disabled={isExecuting}
                                                        >
                                                            {isExecuting ? <RefreshCw size={13} className="qa-spin" /> : <Play size={13} />}
                                                            <span>Run Live Test</span>
                                                        </button>
                                                    ) : testMode === 'website' ? (
                                                        <span className="qa-blocked-text" title="Browser automation engine not connected">
                                                            No Engine
                                                        </span>
                                                    ) : (
                                                        <span className="qa-blocked-text" title="Mobile emulator or real device required">
                                                            No Device
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Non-API Mode Explanations */}
                    {testMode === 'website' && (
                        <div className="qa-info-banner">
                            <AlertCircle size={18} className="text-warn" />
                            <div>
                                <strong>Website Browser Automation Notice:</strong> Browser automation engine (Playwright / Selenium) is not yet connected. Test cases above are generated by MicroMind AI and marked as <code>BLOCKED / NOT EXECUTED</code> until browser execution is configured.
                            </div>
                        </div>
                    )}

                    {testMode === 'app' && (
                        <div className="qa-info-banner">
                            <Smartphone size={18} className="text-warn" />
                            <div>
                                <strong>Mobile / App Device Environment Notice:</strong> Mobile emulator or real device runner (Appium / Detox) is required for execution. App test cases above are generated by MicroMind AI and marked as <code>BLOCKED / NOT EXECUTED</code>.
                            </div>
                        </div>
                    )}

                    {/* Detected Defects Section */}
                    {detectedBugs.length > 0 && (
                        <section className="qa-card" style={{ border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.04)' }}>
                            <div className="qa-card-header">
                                <div className="qa-header-group">
                                    <Bug size={18} className="text-fail" />
                                    <h3 className="qa-card-title">STEP 5: Detected Bug Reports</h3>
                                </div>
                                <span className="qa-badge badge-fail">{detectedBugs.length} Defect Logged</span>
                            </div>

                            <div className="qa-table-wrapper">
                                <table className="qa-table">
                                    <thead>
                                        <tr>
                                            <th>Bug ID</th>
                                            <th>Description</th>
                                            <th>Expected Result</th>
                                            <th>Actual Result</th>
                                            <th>Severity</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detectedBugs.map((b) => (
                                            <tr key={b.id} className="tr-fail">
                                                <td className="font-mono text-fail fw-bold">{b.id}</td>
                                                <td>{b.description}</td>
                                                <td className="text-muted-fg">{b.expectedResult}</td>
                                                <td className="text-fail fw-semibold">{b.actualResult}</td>
                                                <td>
                                                    <span className="qa-badge badge-warn">{b.severity}</span>
                                                </td>
                                                <td>
                                                    <span className="qa-badge badge-fail">{b.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIQATestingPage;
