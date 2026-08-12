import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTestingHistory } from '../../services/qaHistoryService';
import { getTestCases, getBugs } from '../../services/qaTestCaseService';

import {
    Sparkles,
    BarChart3,
    CheckCircle2,
    XCircle,
    Bug,
    TrendingUp,
    Search,
    ShieldAlert,
    Plus,
    Layers,
    Play,
    Percent,
    PieChart as PieIcon,
    BarChart as BarIcon,
    Clock,
    ArrowRight
} from 'lucide-react';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';

import './MicroMindQADashboard.css';

const MicroMindQADashboard = () => {
    const navigate = useNavigate();

    // Live Unified State (Driven strictly by single source of truth)
    const [testCases, setTestCases] = useState(() => getTestCases());
    const [bugs, setBugs] = useState(() => getBugs());
    const [historyList, setHistoryList] = useState(() => getTestingHistory());

    // Search Filter State
    const [searchQuery, setSearchQuery] = useState('');

    // Dynamic Refresh: Re-fetch execution history & recalculate all metrics automatically
    useEffect(() => {
        const handleSync = () => {
            setTestCases(getTestCases());
            setBugs(getBugs());
            setHistoryList(getTestingHistory());
        };

        handleSync();

        window.addEventListener('qa_test_cases_updated', handleSync);
        window.addEventListener('qa_testing_history_updated', handleSync);
        window.addEventListener('focus', handleSync);
        window.addEventListener('storage', handleSync);

        return () => {
            window.removeEventListener('qa_test_cases_updated', handleSync);
            window.removeEventListener('qa_testing_history_updated', handleSync);
            window.removeEventListener('focus', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, []);

    // Dynamic Time-Based Greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning 👋';
        if (hour < 18) return 'Good afternoon 👋';
        return 'Good evening 👋';
    }, []);

    // 1. DASHBOARD METRICS DEFINITIONS:
    // - Test Cases = unique saved test cases count
    // - Executions = total actual test executions
    // - Passed = executions with status PASS
    // - Failed = executions with status FAIL (e.g. 25)
    // - Pass Rate = Passed / Executions × 100
    // - Unique Defects = calculated from actual deduplicated defects (e.g. 4)
    const metrics = useMemo(() => {
        const executed = historyList ? historyList.length : 0;
        let passed = 0;
        let failed = 0;

        if (historyList && historyList.length > 0) {
            historyList.forEach(h => {
                if (h.status === 'PASS') passed++;
                else if (h.status === 'FAIL') failed++;
            });
        }

        const totalTestCases = testCases ? testCases.length : 0;
        const passRate = executed > 0 ? Math.round((passed / executed) * 100) : 0;
        const bugCount = bugs ? bugs.length : 0;

        return {
            testCases: totalTestCases,
            executed,
            passed,
            failed,
            passRate,
            bugCount
        };
    }, [historyList, testCases, bugs]);

    // 2. CHART 1 DATA: Bar Chart — Test Results (Passed vs Failed from live execution history)
    const barChartData = useMemo(() => {
        return [
            { category: 'Passed', count: metrics.passed, fill: '#10B981' },
            { category: 'Failed', count: metrics.failed, fill: '#EF4444' }
        ];
    }, [metrics]);

    // 2. CHART 2 DATA: Pie Chart — Execution Distribution (Proportion of Passed vs Failed)
    const pieChartData = useMemo(() => {
        const data = [
            { name: 'Passed', value: metrics.passed, color: '#10B981' },
            { name: 'Failed', value: metrics.failed, color: '#EF4444' }
        ];
        return data.filter(d => d.value > 0);
    }, [metrics]);

    // 3. RECENT TEST EXECUTIONS (Newest executions first)
    const displayExecutions = useMemo(() => {
        if (!historyList || historyList.length === 0) return [];

        const sorted = [...historyList].reverse().map((h, idx) => ({
            id: h.id || h.executionId || `EXEC-${historyList.length - idx}`,
            testCaseId: h.testCaseId || `TC-00${(idx % 8) + 1}`,
            description: h.description || h.question || 'API Test Execution',
            method: h.method || (h.target ? (h.target.split(' ')[0] || 'POST') : 'POST'),
            status: h.status === 'PASS' ? 'PASS' : 'FAIL',
            httpStatus: h.httpCode || h.httpStatus || h.actualStatus || 'Not provided',
            responseTime: (h.timeMs !== undefined && h.timeMs !== 'Not provided') ? (typeof h.timeMs === 'number' ? `${h.timeMs}ms` : String(h.timeMs)) : 'Not provided',
            date: h.timestamp || h.date || 'Just now',
            raw: h
        }));

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return sorted.filter(item =>
                item.description.toLowerCase().includes(q) ||
                item.method.toLowerCase().includes(q) ||
                item.id.toLowerCase().includes(q) ||
                item.testCaseId.toLowerCase().includes(q)
            );
        }

        return sorted;
    }, [historyList, searchQuery]);

    // 4. RECENT BUGS (Unique Deduplicated Defects)
    const displayBugs = useMemo(() => {
        if (!bugs || bugs.length === 0) return [];
        return [...bugs].reverse().map(b => ({
            id: b.id,
            title: b.title || b.description || 'Validation Defect',
            severity: (b.severity || 'HIGH').toUpperCase(),
            testCase: b.testCaseId || b.id.replace('BUG', 'TC'),
            occurrences: b.occurrences || (b.relatedExecutions ? b.relatedExecutions.length : 1),
            status: b.status || 'Open'
        }));
    }, [bugs]);

    return (
        <div className="mm-dashboard-container">
            {/* DASHBOARD HEADER */}
            <header className="mm-dash-header">
                <div>
                    <div className="mm-greeting-pill">
                        <Sparkles size={14} className="mm-spark-accent" />
                        <span>AI QA MONITORING DASHBOARD</span>
                    </div>
                    <h1 className="mm-dash-greeting">{greeting}</h1>
                    <p className="mm-dash-subtitle">
                        Real-time execution analytics, passed vs failed metrics, and defect reporting.
                    </p>
                </div>

                <div className="mm-dash-actions">
                    <button
                        className="mm-btn-primary"
                        onClick={() => navigate('/ai-qa-testing')}
                    >
                        <Plus size={18} />
                        <span>Create New Test</span>
                    </button>
                </div>
            </header>

            {/* DYNAMIC METRICS CARDS */}
            <section className="mm-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '1.5rem' }}>
                {/* Metric 1: Test Cases */}
                <div className="mm-stat-card">
                    <div className="mm-stat-header">
                        <span className="mm-stat-label">TEST CASES</span>
                        <div className="mm-stat-icon-wrapper icon-indigo">
                            <Layers size={18} />
                        </div>
                    </div>
                    <div className="mm-stat-body">
                        <div className="mm-stat-number">{metrics.testCases}</div>
                        <div className="mm-stat-trend trend-positive">
                            <BarChart3 size={13} />
                            <span>Unique Suite</span>
                        </div>
                    </div>
                    <div className="mm-stat-footer">
                        <span>Configured Test Cases</span>
                    </div>
                </div>

                {/* Metric 2: Executions */}
                <div className="mm-stat-card">
                    <div className="mm-stat-header">
                        <span className="mm-stat-label">EXECUTIONS</span>
                        <div className="mm-stat-icon-wrapper icon-indigo">
                            <Play size={18} />
                        </div>
                    </div>
                    <div className="mm-stat-body">
                        <div className="mm-stat-number">{metrics.executed}</div>
                        <div className="mm-stat-trend trend-positive">
                            <TrendingUp size={13} />
                            <span>Total Executions</span>
                        </div>
                    </div>
                    <div className="mm-stat-footer">
                        <span>Recorded Executions</span>
                    </div>
                </div>

                {/* Metric 3: Passed */}
                <div className="mm-stat-card">
                    <div className="mm-stat-header">
                        <span className="mm-stat-label">PASSED</span>
                        <div className="mm-stat-icon-wrapper icon-emerald">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="mm-stat-body">
                        <div className="mm-stat-number text-emerald">{metrics.passed}</div>
                        <div className="mm-stat-badge badge-emerald">
                            <span>Successful</span>
                        </div>
                    </div>
                    <div className="mm-stat-footer">
                        <span>PASS Status Executions</span>
                    </div>
                </div>

                {/* Metric 4: Failed Executions */}
                <div className="mm-stat-card">
                    <div className="mm-stat-header">
                        <span className="mm-stat-label">FAILED EXECUTIONS</span>
                        <div className="mm-stat-icon-wrapper icon-rose">
                            <XCircle size={18} />
                        </div>
                    </div>
                    <div className="mm-stat-body">
                        <div className="mm-stat-number text-rose">{metrics.failed}</div>
                        <div className="mm-stat-badge badge-rose">
                            <span>{metrics.bugCount} Unique Bugs</span>
                        </div>
                    </div>
                    <div className="mm-stat-footer">
                        <span>FAIL Status Executions</span>
                    </div>
                </div>

                {/* Metric 5: Pass Rate */}
                <div className="mm-stat-card">
                    <div className="mm-stat-header">
                        <span className="mm-stat-label">PASS RATE</span>
                        <div className="mm-stat-icon-wrapper icon-emerald">
                            <Percent size={18} />
                        </div>
                    </div>
                    <div className="mm-stat-body">
                        <div className="mm-stat-number text-emerald">{metrics.passRate}%</div>
                        <div className="mm-stat-badge badge-emerald">
                            <span>Quality Index</span>
                        </div>
                    </div>
                    <div className="mm-stat-footer">
                        <span>Passed / Executions × 100</span>
                    </div>
                </div>
            </section>

            {/* TWO CHARTS SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* CHART 1: BAR CHART — TEST RESULTS */}
                <section className="mm-dash-card">
                    <div className="mm-card-top-bar">
                        <div>
                            <div className="mm-card-pretitle" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <BarIcon size={14} className="text-indigo" />
                                <span>BAR CHART</span>
                            </div>
                            <h3 className="mm-card-heading">Test Results (Passed vs Failed)</h3>
                        </div>
                    </div>

                    <div className="mm-chart-box" style={{ height: '240px', padding: '1rem 0' }}>
                        {metrics.executed === 0 ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', gap: '0.5rem' }}>
                                <BarChart3 size={32} />
                                <span>No execution data recorded yet.</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                                    <XAxis dataKey="category" stroke="#94A3B8" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0F172A',
                                            borderColor: 'rgba(255, 255, 255, 0.12)',
                                            borderRadius: '8px',
                                            color: '#F8FAFC'
                                        }}
                                    />
                                    <Bar dataKey="count" name="Executions" radius={[6, 6, 0, 0]}>
                                        {barChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                {/* CHART 2: PIE CHART — EXECUTION DISTRIBUTION */}
                <section className="mm-dash-card">
                    <div className="mm-card-top-bar">
                        <div>
                            <div className="mm-card-pretitle" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <PieIcon size={14} className="text-indigo" />
                                <span>PIE CHART</span>
                            </div>
                            <h3 className="mm-card-heading">Execution Distribution</h3>
                        </div>
                    </div>

                    <div className="mm-chart-box" style={{ height: '240px', padding: '1rem 0' }}>
                        {metrics.executed === 0 ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', gap: '0.5rem' }}>
                                <PieIcon size={32} />
                                <span>No execution data recorded yet.</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0F172A',
                                            borderColor: 'rgba(255, 255, 255, 0.12)',
                                            borderRadius: '8px',
                                            color: '#F8FAFC'
                                        }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>
            </div>

            {/* RECENT TEST EXECUTIONS TABLE */}
            <section className="mm-dash-card mm-table-card" style={{ marginBottom: '1.5rem' }}>
                <div className="mm-table-header-row">
                    <div>
                        <div className="mm-card-pretitle">EXECUTION LOGS</div>
                        <h3 className="mm-card-heading">
                            Recent Test Executions (Showing {Math.min(5, displayExecutions.length)} of {metrics.executed} executions)
                        </h3>
                    </div>

                    <div className="mm-table-filters" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="mm-search-box">
                            <Search size={15} className="mm-search-icon" />
                            <input
                                type="text"
                                placeholder="Search executions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mm-search-input"
                            />
                        </div>

                        <button
                            onClick={() => navigate('/history')}
                            className="mm-btn-link"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                        >
                            <span>View All Executions</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="mm-table-wrapper">
                    <table className="mm-table">
                        <thead>
                            <tr>
                                <th style={{ width: '110px' }}>Execution ID</th>
                                <th style={{ width: '90px' }}>Test Case</th>
                                <th>Description</th>
                                <th style={{ width: '80px' }}>Method</th>
                                <th style={{ width: '90px' }}>Status</th>
                                <th style={{ width: '130px' }}>HTTP Status</th>
                                <th style={{ width: '110px' }}>Response Time</th>
                                <th style={{ width: '130px' }}>Execution Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayExecutions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                                        No recent test executions recorded yet. Create and run tests to see results here.
                                    </td>
                                </tr>
                            ) : (
                                displayExecutions.slice(0, 5).map((item) => (
                                    <tr key={item.id} className={`mm-tr ${item.status === 'FAIL' ? 'tr-fail' : ''}`}>
                                        <td className="font-mono text-indigo fw-bold">{item.id}</td>
                                        <td className="font-mono text-muted">{item.testCaseId}</td>
                                        <td className="fw-semibold" style={{ color: '#F8FAFC' }}>{item.description}</td>
                                        <td>
                                            <span className="mm-method-pill font-mono">{item.method}</span>
                                        </td>
                                        <td>
                                            <span className={`qa-badge ${item.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="font-mono" style={{ color: item.status === 'FAIL' ? '#F87171' : '#34D399', fontWeight: 600 }}>
                                            {item.httpStatus}
                                        </td>
                                        <td className="font-mono text-muted">{item.responseTime}</td>
                                        <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            {item.date}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* RECENT BUGS TABLE (Deduplicated Unique Defects with Occurrences) */}
            <section className="mm-dash-card mm-bugs-card">
                <div className="mm-card-top-bar">
                    <div>
                        <div className="mm-card-pretitle">DEDUPLICATED DEFECT LOGS</div>
                        <h3 className="mm-card-heading">
                            Recent Bugs (Showing {Math.min(5, displayBugs.length)} of {metrics.bugCount} unique defects)
                        </h3>
                    </div>
                    <button onClick={() => navigate('/bugs')} className="mm-btn-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span>View All Defects</span>
                        <ArrowRight size={14} />
                    </button>
                </div>

                <div className="mm-table-wrapper">
                    <table className="mm-table">
                        <thead>
                            <tr>
                                <th style={{ width: '100px' }}>Bug ID</th>
                                <th>Bug Title</th>
                                <th style={{ width: '110px' }}>Severity</th>
                                <th style={{ width: '110px' }}>Occurrences</th>
                                <th style={{ width: '110px' }}>Test Case</th>
                                <th style={{ width: '100px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayBugs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                                        No defects logged. All executed test cases passed!
                                    </td>
                                </tr>
                            ) : (
                                displayBugs.slice(0, 5).map((b) => (
                                    <tr key={b.id} className="mm-tr tr-fail">
                                        <td className="font-mono text-rose fw-bold">{b.id}</td>
                                        <td className="fw-semibold" style={{ color: '#F8FAFC' }}>
                                            {b.title}
                                        </td>
                                        <td>
                                            <span className="mm-sev-badge sev-critical">
                                                <ShieldAlert size={12} />
                                                <span>{b.severity}</span>
                                            </span>
                                        </td>
                                        <td>
                                            <span className="qa-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontWeight: 700 }}>
                                                {b.occurrences} {b.occurrences === 1 ? 'run' : 'runs'}
                                            </span>
                                        </td>
                                        <td className="font-mono text-muted">{b.testCase}</td>
                                        <td>
                                            <span className="qa-badge badge-fail">{b.status}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default MicroMindQADashboard;
