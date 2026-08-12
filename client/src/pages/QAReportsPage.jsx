import React, { useState, useEffect, useMemo } from 'react';
import { getTestingHistory } from '../services/qaHistoryService';
import { getTestCases, getBugs } from '../services/qaTestCaseService';
import { Download, BarChart3, PieChart, ShieldAlert, CheckCircle2, XCircle, FileText, Clock } from 'lucide-react';
import './QAReportsPage.css';

const QAReportsPage = () => {
    const [testCases, setTestCases] = useState(() => getTestCases());
    const [historyList, setHistoryList] = useState(() => getTestingHistory());
    const [bugsList, setBugsList] = useState(() => getBugs());

    useEffect(() => {
        const handleSync = () => {
            setTestCases(getTestCases());
            setHistoryList(getTestingHistory());
            setBugsList(getBugs());
        };
        window.addEventListener('qa_test_cases_updated', handleSync);
        window.addEventListener('qa_testing_history_updated', handleSync);
        return () => {
            window.removeEventListener('qa_test_cases_updated', handleSync);
            window.removeEventListener('qa_testing_history_updated', handleSync);
        };
    }, []);

    // Summary Metrics (Separating Execution Summary and Defect Summary)
    const metrics = useMemo(() => {
        const totalTestCases = testCases.length;
        const totalExecutions = historyList.length;
        const passed = historyList.filter(h => h.status === 'PASS').length;
        const failed = historyList.filter(h => h.status === 'FAIL').length;
        const passRate = totalExecutions > 0 ? Math.round((passed / totalExecutions) * 100) : 0;

        const uniqueDefects = bugsList.length;
        const totalOccurrences = bugsList.reduce((acc, b) => acc + (b.occurrences || (b.relatedExecutions ? b.relatedExecutions.length : 1)), 0);

        return {
            totalTestCases,
            totalExecutions,
            passed,
            failed,
            passRate,
            uniqueDefects,
            totalOccurrences
        };
    }, [testCases, historyList, bugsList]);

    // Test Coverage Metrics
    const coverage = useMemo(() => {
        let getCount = 0;
        let postCount = 0;
        let positiveCount = 0;
        let negativeCount = 0;

        testCases.forEach(tc => {
            if ((tc.method || '').toUpperCase() === 'GET') getCount++;
            else postCount++;

            if ((tc.type || 'Positive') === 'Positive') positiveCount++;
            else negativeCount++;
        });

        return {
            getCount,
            postCount,
            positiveCount,
            negativeCount
        };
    }, [testCases]);

    return (
        <div className="qa-reports-page-container">
            {/* Page Header */}
            <div className="qa-reports-header">
                <div>
                    <span className="qa-tag font-mono">EXECUTIVE QUALITY ASSURANCE AUDIT</span>
                    <h1 className="qa-reports-title">Executive QA Test Analysis & Audit Report</h1>
                </div>

                <button className="qa-primary-btn" onClick={() => window.print()}>
                    <Download size={16} />
                    <span>Export Quality PDF</span>
                </button>
            </div>

            {/* SECTION 1: EXECUTION & DEFECT SUMMARY METRICS */}
            <section className="qa-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                    <BarChart3 size={18} className="text-indigo" />
                    <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>Executive Summary Metrics</h3>
                </div>

                {/* 1A: Execution Summary */}
                <div style={{ marginBottom: '1rem' }}>
                    <span className="font-mono text-indigo" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        1. EXECUTION SUMMARY
                    </span>
                    <div className="mm-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginTop: '0.5rem' }}>
                        <div className="mm-stat-card">
                            <span className="mm-stat-label">TOTAL TEST CASES</span>
                            <div className="mm-stat-number" style={{ marginTop: '0.4rem' }}>{metrics.totalTestCases}</div>
                        </div>
                        <div className="mm-stat-card">
                            <span className="mm-stat-label">TOTAL EXECUTIONS</span>
                            <div className="mm-stat-number" style={{ marginTop: '0.4rem' }}>{metrics.totalExecutions}</div>
                        </div>
                        <div className="mm-stat-card">
                            <span className="mm-stat-label">PASSED</span>
                            <div className="mm-stat-number text-emerald" style={{ marginTop: '0.4rem' }}>{metrics.passed}</div>
                        </div>
                        <div className="mm-stat-card">
                            <span className="mm-stat-label">FAILED</span>
                            <div className="mm-stat-number text-rose" style={{ marginTop: '0.4rem' }}>{metrics.failed}</div>
                        </div>
                        <div className="mm-stat-card">
                            <span className="mm-stat-label">PASS RATE</span>
                            <div className="mm-stat-number text-emerald" style={{ marginTop: '0.4rem' }}>{metrics.passRate}%</div>
                        </div>
                    </div>
                </div>

                {/* 1B: Defect Summary */}
                <div>
                    <span className="font-mono text-rose" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        2. DEFECT SUMMARY (DEDUPLICATED)
                    </span>
                    <div className="mm-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '0.5rem' }}>
                        <div className="mm-stat-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <span className="mm-stat-label">UNIQUE DEFECTS</span>
                            <div className="mm-stat-number text-rose" style={{ marginTop: '0.4rem' }}>{metrics.uniqueDefects} Issues</div>
                        </div>
                        <div className="mm-stat-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <span className="mm-stat-label">TOTAL FAILED EXECUTIONS</span>
                            <div className="mm-stat-number text-rose" style={{ marginTop: '0.4rem' }}>{metrics.failed} Runs</div>
                        </div>
                        <div className="mm-stat-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <span className="mm-stat-label">DEFECT OCCURRENCES</span>
                            <div className="mm-stat-number text-rose" style={{ marginTop: '0.4rem' }}>{metrics.totalOccurrences} Times</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: TEST COVERAGE */}
            <section className="qa-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                    <PieChart size={18} className="text-indigo" />
                    <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>Test Suite Coverage</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px' }}>
                        <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>GET HTTP TESTS</span>
                        <span className="font-mono" style={{ color: '#6366F1', fontSize: '1.25rem', fontWeight: 800 }}>{coverage.getCount} Suites</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px' }}>
                        <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>POST HTTP TESTS</span>
                        <span className="font-mono" style={{ color: '#818CF8', fontSize: '1.25rem', fontWeight: 800 }}>{coverage.postCount} Suites</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px' }}>
                        <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>POSITIVE TESTS</span>
                        <span className="font-mono text-emerald" style={{ fontSize: '1.25rem', fontWeight: 800 }}>{coverage.positiveCount} Cases</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px' }}>
                        <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>NEGATIVE TESTS</span>
                        <span className="font-mono text-rose" style={{ fontSize: '1.25rem', fontWeight: 800 }}>{coverage.negativeCount} Cases</span>
                    </div>
                </div>
            </section>

            {/* SECTION 3: EXECUTION RESULTS (Shows all executions) */}
            <section className="qa-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                    <FileText size={18} className="text-indigo" />
                    <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>Test Execution Log Audit ({historyList.length} Executions)</h3>
                </div>

                <div className="qa-table-wrapper">
                    <table className="qa-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px' }}>Test Case</th>
                                <th>Description</th>
                                <th style={{ width: '80px' }}>Method</th>
                                <th>Endpoint</th>
                                <th>Expected Result</th>
                                <th style={{ width: '90px' }}>Status</th>
                                <th style={{ width: '120px' }}>HTTP Status</th>
                                <th style={{ width: '110px' }}>Response Time</th>
                                <th style={{ width: '130px' }}>Execution Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyList.map((h) => (
                                <tr key={h.id} className={h.status === 'FAIL' ? 'tr-fail' : ''}>
                                    <td className="font-mono text-indigo fw-bold">{h.testCaseId || 'TC-001'}</td>
                                    <td className="fw-semibold" style={{ color: '#F8FAFC' }}>{h.description || h.question}</td>
                                    <td><span className="mm-method-pill font-mono">{h.method || 'POST'}</span></td>
                                    <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>{h.endpoint || h.target}</td>
                                    <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>{h.expectedBehavior || h.expectedStatus}</td>
                                    <td><span className={`qa-badge ${h.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>{h.status}</span></td>
                                    <td className="font-mono" style={{ color: h.status === 'FAIL' ? '#F87171' : '#34D399', fontWeight: 600 }}>{h.httpStatus || h.httpCode}</td>
                                    <td className="font-mono text-muted">{h.responseTime || h.timeMs}</td>
                                    <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>{h.timestamp || h.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* SECTION 4: DEFECTS (Lists Unique Defects with Occurrences & Related Executions) */}
            <section className="qa-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                    <ShieldAlert size={18} className="text-rose" />
                    <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>Unique Defects Audit Log ({bugsList.length} Unique Issues)</h3>
                </div>

                <div className="qa-table-wrapper">
                    <table className="qa-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px' }}>Defect ID</th>
                                <th style={{ width: '90px' }}>Test Case</th>
                                <th>Bug Title</th>
                                <th style={{ width: '100px' }}>Occurrences</th>
                                <th>Related Executions</th>
                                <th style={{ width: '100px' }}>Severity</th>
                                <th style={{ width: '120px' }}>HTTP Status</th>
                                <th style={{ width: '90px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bugsList.map((b) => {
                                const occ = b.occurrences || (b.relatedExecutions ? b.relatedExecutions.length : 1);
                                const relExecs = b.relatedExecutions && b.relatedExecutions.length > 0 ? b.relatedExecutions.join(', ') : (b.executionId || 'EXEC-1001');

                                return (
                                    <tr key={b.id} className="tr-fail">
                                        <td className="font-mono text-rose fw-bold">{b.id}</td>
                                        <td className="font-mono text-muted">{b.testCaseId}</td>
                                        <td className="fw-semibold" style={{ color: '#F8FAFC' }}>{b.title || b.description}</td>
                                        <td>
                                            <span className="qa-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontWeight: 700 }}>
                                                {occ} {occ === 1 ? 'time' : 'times'}
                                            </span>
                                        </td>
                                        <td className="font-mono text-indigo" style={{ fontSize: '0.78rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={relExecs}>
                                            {relExecs}
                                        </td>
                                        <td>
                                            <span className="mm-sev-badge sev-critical">
                                                <span>{b.severity}</span>
                                            </span>
                                        </td>
                                        <td className="font-mono text-rose">{b.httpStatus}</td>
                                        <td><span className="qa-badge badge-fail">{b.status}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default QAReportsPage;
