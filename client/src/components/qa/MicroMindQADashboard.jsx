import React, { useState, useMemo } from 'react';
import { initialTestCasesData, initialBugsData, API_ENDPOINT, LOCAL_API_ENDPOINT } from '../../data/qaTestData';
import { getTestingHistory } from '../../services/qaHistoryService';
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    PieChart as PieIcon,
    BarChart3,
    Bug,
    Terminal,
    Search,
    Filter,
    Play,
    RefreshCw,
    ShieldAlert,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Zap,
    Cpu
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import './MicroMindQADashboard.css';

const MicroMindQADashboard = () => {
    const [testCases] = useState(initialTestCasesData);
    const [bugs] = useState(initialBugsData);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [expandedRow, setExpandedRow] = useState(null);
    const [copiedUrl, setCopiedUrl] = useState(false);

    // Live API Tester State
    const [livePayload, setLivePayload] = useState('{"message": "Hello World"}');
    const [liveTargetUrl, setLiveTargetUrl] = useState(LOCAL_API_ENDPOINT);
    const [liveResponse, setLiveResponse] = useState(null);
    const [isTestingLive, setIsTestingLive] = useState(false);

    // Dynamic Summary Calculations (Separates defined Test Cases from Test Runs/History)
    const metrics = useMemo(() => {
        let historyList = [];
        try { historyList = getTestingHistory(); } catch (e) { }

        // Defined Unique Test Cases Metrics (4 Test Cases)
        const total = testCases.length;
        const passed = testCases.filter((tc) => tc.status === 'PASS').length;
        const failed = testCases.filter((tc) => tc.status === 'FAIL').length;
        const notExecuted = testCases.filter(
            (tc) => tc.status === 'NOT EXECUTED' || tc.status === 'BLOCKED'
        ).length;
        const executed = total - notExecuted;

        const overallSuccessRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
        const executedSuccessRate = executed > 0 ? ((passed / executed) * 100).toFixed(1) : '0.0';

        // Separate Test Runs Execution Metrics from Testing History
        const totalTestRuns = historyList.length;
        const passedRuns = historyList.filter(h => h.status === 'PASS').length;
        const failedRuns = historyList.filter(h => h.status === 'FAIL').length;

        return {
            total,
            passed,
            failed,
            notExecuted,
            executed,
            overallSuccessRate,
            executedSuccessRate,
            totalTestRuns,
            passedRuns,
            failedRuns
        };
    }, [testCases]);

    // Data for Visual Distribution Charts
    const pieChartData = [
        { name: 'PASS', value: metrics.passed, color: '#10B981' },
        { name: 'FAIL', value: metrics.failed, color: '#EF4444' },
        { name: 'NOT EXECUTED', value: metrics.notExecuted, color: '#F59E0B' }
    ];

    const barChartData = [
        { name: 'Passed', count: metrics.passed, fill: '#10B981' },
        { name: 'Failed', count: metrics.failed, fill: '#EF4444' },
        { name: 'Not Executed', count: metrics.notExecuted, fill: '#F59E0B' }
    ];

    // Filtered Test Cases
    const filteredCases = useMemo(() => {
        return testCases.filter((tc) => {
            const matchesSearch =
                tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tc.expectedResult.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tc.actualResult.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'PASS' && tc.status === 'PASS') ||
                (statusFilter === 'FAIL' && tc.status === 'FAIL') ||
                (statusFilter === 'NOT_EXECUTED' && (tc.status === 'NOT EXECUTED' || tc.status === 'BLOCKED'));

            return matchesSearch && matchesStatus;
        });
    }, [testCases, searchQuery, statusFilter]);

    // Copy URL helper
    const handleCopyUrl = (urlStr) => {
        navigator.clipboard.writeText(urlStr);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    // Live API Test Execution
    const handleRunLiveTest = async () => {
        setIsTestingLive(true);
        setLiveResponse(null);
        const startTime = Date.now();

        try {
            let parsedBody;
            try {
                parsedBody = JSON.parse(livePayload);
            } catch (e) {
                setLiveResponse({
                    error: true,
                    status: 'Client Syntax Error',
                    timeMs: Date.now() - startTime,
                    data: { message: 'Invalid JSON payload format provided in runner input' }
                });
                setIsTestingLive(false);
                return;
            }

            const res = await fetch(liveTargetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedBody)
            });

            const resData = await res.json().catch(() => ({ message: 'Non-JSON response' }));
            const duration = Date.now() - startTime;

            setLiveResponse({
                status: res.status,
                statusText: res.statusText,
                ok: res.ok,
                timeMs: duration,
                data: resData
            });
        } catch (err) {
            setLiveResponse({
                error: true,
                status: 'Network Error',
                timeMs: Date.now() - startTime,
                data: { message: err.message || 'Failed to reach API endpoint' }
            });
        } finally {
            setIsTestingLive(false);
        }
    };

    // Helper badge renderer
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'PASS':
                return (
                    <span className="qa-badge badge-pass">
                        <CheckCircle2 size={13} />
                        <span>PASS</span>
                    </span>
                );
            case 'FAIL':
                return (
                    <span className="qa-badge badge-fail">
                        <XCircle size={13} />
                        <span>FAIL</span>
                    </span>
                );
            case 'NOT EXECUTED':
            case 'BLOCKED':
            default:
                return (
                    <span className="qa-badge badge-not-executed">
                        <AlertCircle size={13} />
                        <span>NOT EXECUTED</span>
                    </span>
                );
        }
    };

    return (
        <div className="mm-qa-dashboard">
            {/* Top Brand Header */}
            <header className="mm-qa-header">
                <div className="mm-qa-header-brand">
                    <div className="mm-qa-logo-box">
                        <Cpu size={24} className="mm-qa-logo-icon" />
                    </div>
                    <div>
                        <div className="mm-qa-header-subtitle">MICROMIND AI QA SUITE</div>
                        <h1 className="mm-qa-header-title">MicroMind QA Dashboard</h1>
                    </div>
                </div>

                <div className="mm-qa-header-endpoint">
                    <div className="mm-endpoint-pill">
                        <span className="mm-pulse-dot"></span>
                        <span className="mm-endpoint-label">LIVE API:</span>
                        <code className="mm-endpoint-url">{API_ENDPOINT}</code>
                        <button
                            className="mm-copy-btn"
                            onClick={() => handleCopyUrl(API_ENDPOINT)}
                            title="Copy Public Endpoint URL"
                        >
                            {copiedUrl ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Dynamic Summary Metric Cards */}
            <section className="mm-summary-grid">
                {/* Total Test Cases */}
                <div className="mm-card mm-metric-card">
                    <div className="mm-metric-header">
                        <span className="mm-metric-title">Total Test Cases</span>
                        <div className="mm-metric-icon icon-total">
                            <BarChart3 size={18} />
                        </div>
                    </div>
                    <div className="mm-metric-value">{metrics.total}</div>
                    <div className="mm-metric-footer">
                        <span>{metrics.totalTestRuns} Total Executed Test Runs</span>
                    </div>
                </div>

                {/* Passed Test Cases */}
                <div className="mm-card mm-metric-card">
                    <div className="mm-metric-header">
                        <span className="mm-metric-title">Passed Cases</span>
                        <div className="mm-metric-icon icon-pass">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="mm-metric-value text-pass">{metrics.passed}</div>
                    <div className="mm-metric-footer text-pass">
                        <span>{metrics.passedRuns} Passed History Runs</span>
                    </div>
                </div>

                {/* Failed Test Cases */}
                <div className="mm-card mm-metric-card">
                    <div className="mm-metric-header">
                        <span className="mm-metric-title">Failed Cases</span>
                        <div className="mm-metric-icon icon-fail">
                            <XCircle size={18} />
                        </div>
                    </div>
                    <div className="mm-metric-value text-fail">{metrics.failed}</div>
                    <div className="mm-metric-footer text-fail">
                        <span>{metrics.failedRuns} Failed History Runs (BUG-001)</span>
                    </div>
                </div>

                {/* Not Executed */}
                <div className="mm-card mm-metric-card">
                    <div className="mm-metric-header">
                        <span className="mm-metric-title">Not Executed</span>
                        <div className="mm-metric-icon icon-warn">
                            <AlertCircle size={18} />
                        </div>
                    </div>
                    <div className="mm-metric-value text-warn">{metrics.notExecuted}</div>
                    <div className="mm-metric-footer text-warn">
                        <span>0 Blocked Cases</span>
                    </div>
                </div>

                {/* Success Rate */}
                <div className="mm-card mm-metric-card card-rate">
                    <div className="mm-metric-header">
                        <span className="mm-metric-title">Success Rate</span>
                        <div className="mm-metric-icon icon-gold">
                            <Zap size={18} />
                        </div>
                    </div>
                    <div className="mm-metric-value text-gold">{metrics.overallSuccessRate}%</div>
                    <div className="mm-metric-footer">
                        <span>{metrics.passed} Passed / {metrics.total} Unique Test Cases</span>
                    </div>
                </div>
            </section>

            {/* Charts & Distribution Section */}
            <section className="mm-charts-section">
                {/* Pie Chart */}
                <div className="mm-card mm-chart-card">
                    <div className="mm-card-header">
                        <div className="mm-card-title-group">
                            <PieIcon size={18} className="text-gold" />
                            <h3 className="mm-card-title">Test Result Distribution</h3>
                        </div>
                        <span className="mm-card-badge">{metrics.total} Cases</span>
                    </div>
                    <div className="mm-chart-container">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E1E1E',
                                        borderColor: '#333',
                                        borderRadius: '8px',
                                        color: '#FFF'
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span style={{ color: '#DDD', fontSize: '0.85rem' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="mm-card mm-chart-card">
                    <div className="mm-card-header">
                        <div className="mm-card-title-group">
                            <BarChart3 size={18} className="text-gold" />
                            <h3 className="mm-card-title">Status Breakdown</h3>
                        </div>
                        <span className="mm-card-badge">Executed: {metrics.executed}</span>
                    </div>
                    <div className="mm-chart-container">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E1E1E',
                                        borderColor: '#333',
                                        borderRadius: '8px',
                                        color: '#FFF'
                                    }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {barChartData.map((entry, index) => (
                                        <Cell key={`bar-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Test Cases Table Section */}
            <section className="mm-card mm-table-section">
                <div className="mm-table-controls">
                    <div className="mm-card-title-group">
                        <Terminal size={18} className="text-gold" />
                        <h3 className="mm-card-title">Test Cases Results</h3>
                        <span className="mm-count-pill">{filteredCases.length} Cases</span>
                    </div>

                    <div className="mm-filter-bar">
                        {/* Search Input */}
                        <div className="mm-search-box">
                            <Search size={15} className="mm-search-icon" />
                            <input
                                type="text"
                                placeholder="Search test cases or results..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mm-search-input"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="mm-filter-group">
                            <Filter size={14} className="text-muted" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="mm-filter-select"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PASS">PASS</option>
                                <option value="FAIL">FAIL</option>
                                <option value="NOT_EXECUTED">NOT EXECUTED</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mm-table-wrapper">
                    <table className="mm-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px' }}>Test ID</th>
                                <th>Test Case</th>
                                <th>Expected Result</th>
                                <th>Actual Result</th>
                                <th style={{ width: '140px' }}>Status</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCases.map((tc) => {
                                const isExpanded = expandedRow === tc.id;
                                const hasExtraInfo = tc.note || tc.reason || tc.bugId;

                                return (
                                    <React.Fragment key={tc.id}>
                                        <tr
                                            className={`mm-tr ${isExpanded ? 'tr-expanded' : ''} ${tc.status === 'FAIL' ? 'tr-fail' : ''}`}
                                            onClick={() => setExpandedRow(isExpanded ? null : tc.id)}
                                        >
                                            <td className="font-mono text-gold fw-bold">{tc.id}</td>
                                            <td className="fw-semibold">{tc.name}</td>
                                            <td className="text-muted-fg">{tc.expectedResult}</td>
                                            <td className="text-muted-fg">{tc.actualResult}</td>
                                            <td>{renderStatusBadge(tc.status)}</td>
                                            <td className="text-center">
                                                {hasExtraInfo && (
                                                    <button className="mm-expand-btn">
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Expanded Drawer Row for Details / Notes */}
                                        {isExpanded && (
                                            <tr className="mm-tr-details">
                                                <td colSpan={6}>
                                                    <div className="mm-details-box">
                                                        {tc.payload && (
                                                            <div className="mm-detail-item">
                                                                <span className="mm-detail-label">Payload Executed:</span>
                                                                <code className="mm-code-block">{tc.payload}</code>
                                                            </div>
                                                        )}

                                                        {tc.bugId && (
                                                            <div className="mm-detail-item text-fail">
                                                                <span className="mm-detail-label">Linked Defect:</span>
                                                                <span className="mm-bug-tag">
                                                                    <Bug size={13} />
                                                                    {tc.bugId}
                                                                </span>
                                                                <span className="ml-2">{tc.note}</span>
                                                            </div>
                                                        )}

                                                        {tc.note && !tc.bugId && (
                                                            <div className="mm-detail-item text-gold">
                                                                <span className="mm-detail-label">Execution Note:</span>
                                                                <span>{tc.note}</span>
                                                            </div>
                                                        )}

                                                        {tc.reason && (
                                                            <div className="mm-detail-item text-warn">
                                                                <span className="mm-detail-label">Omission Reason:</span>
                                                                <span>{tc.reason}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {filteredCases.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="mm-empty-state">
                                        No test cases found matching query "{searchQuery}".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Bugs Section */}
            <section className="mm-card mm-bugs-section">
                <div className="mm-card-header">
                    <div className="mm-card-title-group">
                        <Bug size={18} className="text-fail" />
                        <h3 className="mm-card-title">Defects & Bugs Identified</h3>
                    </div>
                    <span className="mm-badge badge-fail">{bugs.length} Open Defect</span>
                </div>

                <div className="mm-table-wrapper">
                    <table className="mm-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px' }}>Bug ID</th>
                                <th>Description</th>
                                <th style={{ width: '120px' }}>Severity</th>
                                <th style={{ width: '110px' }}>Status</th>
                                <th style={{ width: '100px' }}>Linked Test</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bugs.map((b) => (
                                <tr key={b.id} className="mm-tr tr-fail">
                                    <td className="font-mono text-fail fw-bold">{b.id}</td>
                                    <td>{b.description}</td>
                                    <td>
                                        <span className="mm-badge badge-severity-medium">
                                            <ShieldAlert size={12} />
                                            {b.severity}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="mm-badge badge-status-open">{b.status}</span>
                                    </td>
                                    <td className="font-mono text-gold">{b.testCaseId}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Interactive Live API Runner Section */}
            <section className="mm-card mm-runner-section">
                <div className="mm-card-header">
                    <div className="mm-card-title-group">
                        <Zap size={18} className="text-gold" />
                        <h3 className="mm-card-title">Interactive Live API Runner</h3>
                    </div>
                    <span className="mm-card-badge">Demo Playground</span>
                </div>

                <div className="mm-runner-grid">
                    <div className="mm-runner-controls">
                        <div className="mm-form-group">
                            <label className="mm-label">Target Endpoint URL:</label>
                            <div className="mm-select-group">
                                <select
                                    value={liveTargetUrl}
                                    onChange={(e) => setLiveTargetUrl(e.target.value)}
                                    className="mm-select"
                                >
                                    <option value={LOCAL_API_ENDPOINT}>Local API (http://localhost:3000/api/messages)</option>
                                    <option value={API_ENDPOINT}>Public Tunnel ({API_ENDPOINT})</option>
                                </select>
                            </div>
                        </div>

                        <div className="mm-form-group">
                            <label className="mm-label">JSON Request Body:</label>
                            <textarea
                                value={livePayload}
                                onChange={(e) => setLivePayload(e.target.value)}
                                rows={4}
                                className="mm-textarea font-mono"
                                placeholder='{"message": "Hello World"}'
                            />
                        </div>

                        <div className="mm-runner-actions">
                            <button
                                className="mm-run-btn"
                                onClick={handleRunLiveTest}
                                disabled={isTestingLive}
                            >
                                {isTestingLive ? (
                                    <>
                                        <RefreshCw size={15} className="mm-spin" />
                                        <span>Executing API Call...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={15} />
                                        <span>Run Live API Test</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Live Output View */}
                    <div className="mm-runner-output">
                        <label className="mm-label">Live Response Output:</label>
                        <div className="mm-response-box">
                            {liveResponse ? (
                                <div>
                                    <div className="mm-response-meta">
                                        <span className={`mm-status-pill ${liveResponse.ok ? 'res-200' : 'res-400'}`}>
                                            HTTP {liveResponse.status}
                                        </span>
                                        <span className="mm-time-pill">{liveResponse.timeMs} ms</span>
                                    </div>
                                    <pre className="mm-json-output">
                                        {JSON.stringify(liveResponse.data, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <div className="mm-response-placeholder">
                                    <Terminal size={24} className="text-muted" />
                                    <span>Click "Run Live API Test" to execute a live request</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default MicroMindQADashboard;
