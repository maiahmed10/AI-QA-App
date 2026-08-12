import React, { useState, useEffect } from 'react';
import { getBugs } from '../services/qaTestCaseService';
import { getTestingHistory } from '../services/qaHistoryService';
import { Bug, ShieldAlert, Search, Filter, Clock, X, Layers } from 'lucide-react';
import './QADetectedBugsPage.css';

const QADetectedBugsPage = () => {
    const [bugsList, setBugsList] = useState(() => getBugs());
    const [historyList, setHistoryList] = useState(() => getTestingHistory());
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [selectedBug, setSelectedBug] = useState(null);

    // Sync listener for real-time defect additions on test execution
    useEffect(() => {
        const handleSync = () => {
            setBugsList(getBugs());
            setHistoryList(getTestingHistory());
        };
        window.addEventListener('qa_test_cases_updated', handleSync);
        window.addEventListener('qa_testing_history_updated', handleSync);
        return () => {
            window.removeEventListener('qa_test_cases_updated', handleSync);
            window.removeEventListener('qa_testing_history_updated', handleSync);
        };
    }, []);

    const totalFailedExecutions = historyList.filter(h => h.status === 'FAIL').length;

    const filteredBugs = bugsList.filter((b) => {
        const matchesQuery =
            (b.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.testCaseId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.title || b.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeverity =
            severityFilter === 'ALL' || (b.severity || 'HIGH').toUpperCase() === severityFilter;
        return matchesQuery && matchesSeverity;
    });

    return (
        <div className="qa-bugs-page-container">
            {/* Page Header */}
            <div className="qa-bugs-page-header">
                <div>
                    <span className="qa-tag font-mono">AUTOMATED DEDUPLICATED DEFECT LOGS</span>
                    <h1 className="qa-bugs-page-title">
                        Unique Defects & Vulnerabilities ({bugsList.length} Unique Defects)
                    </h1>
                </div>

                <div className="qa-bugs-badge-summary">
                    <ShieldAlert size={16} className="text-rose" />
                    <span>{bugsList.length} Unique Defects ({totalFailedExecutions} Failed Executions)</span>
                </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="qa-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '420px' }}>
                    <Search size={16} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search defects by Bug ID, Test Case ID, or Title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="qa-input"
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={15} className="text-muted" />
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="qa-select-sm"
                    >
                        <option value="ALL">All Severities ({bugsList.length})</option>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                    </select>
                </div>
            </div>

            {/* Defects Table: Defect ID | Test Case | Occurrences | Related Executions | Bug Title | Severity | Expected | Actual | Status */}
            <div className="qa-card" style={{ padding: '1.25rem' }}>
                <div className="qa-table-wrapper">
                    <table className="qa-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px' }}>Defect ID</th>
                                <th style={{ width: '90px' }}>Test Case</th>
                                <th style={{ width: '100px' }}>Occurrences</th>
                                <th>Bug Title & Description</th>
                                <th style={{ width: '100px' }}>Severity</th>
                                <th style={{ width: '120px' }}>Expected</th>
                                <th style={{ width: '120px' }}>Actual</th>
                                <th style={{ width: '90px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBugs.map((b) => {
                                const sev = (b.severity || 'HIGH').toUpperCase();
                                const occurrences = b.occurrences || (b.relatedExecutions ? b.relatedExecutions.length : 1);

                                return (
                                    <tr key={b.id} className="tr-fail" onClick={() => setSelectedBug(b)} style={{ cursor: 'pointer' }}>
                                        <td className="font-mono text-rose fw-bold">{b.id}</td>
                                        <td className="font-mono text-muted">{b.testCaseId || 'TC-001'}</td>
                                        <td>
                                            <span className="qa-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontWeight: 700 }}>
                                                {occurrences} {occurrences === 1 ? 'time' : 'times'}
                                            </span>
                                        </td>
                                        <td className="fw-semibold" style={{ color: '#F8FAFC' }}>
                                            {b.title || b.description}
                                        </td>
                                        <td>
                                            <span className={`qa-sev-pill sev-${sev.toLowerCase()}`}>
                                                <ShieldAlert size={12} />
                                                <span>{sev}</span>
                                            </span>
                                        </td>
                                        <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>{b.expectedBehavior || 'HTTP 400'}</td>
                                        <td className="font-mono text-rose fw-semibold" style={{ fontSize: '0.8rem' }}>{b.actualBehavior || 'HTTP 200'}</td>
                                        <td>
                                            <span className={`qa-status-pill status-${(b.status || 'Open').toLowerCase().replace(' ', '-')}`}>
                                                {b.status || 'Open'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredBugs.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                                        No detected bugs matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Bug Modal */}
            {selectedBug && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1.5rem'
                }} onClick={() => setSelectedBug(null)}>
                    <div className="qa-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '720px', background: '#0F172A', border: '1px solid rgba(239, 68, 68, 0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                    <span className="font-mono text-rose fw-bold" style={{ fontSize: '0.9rem' }}>{selectedBug.id}</span>
                                    <span className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>(Linked to {selectedBug.testCaseId})</span>
                                    <span className="qa-badge badge-fail">{selectedBug.status}</span>
                                </div>
                                <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.15rem' }}>{selectedBug.title || selectedBug.description}</h3>
                            </div>
                            <button onClick={() => setSelectedBug(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                                <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>TOTAL OCCURRENCES</span>
                                <span className="font-mono text-rose" style={{ fontSize: '1rem', fontWeight: 800 }}>
                                    {selectedBug.occurrences || (selectedBug.relatedExecutions ? selectedBug.relatedExecutions.length : 1)} Executions
                                </span>
                            </div>

                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                                <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>SEVERITY</span>
                                <span className="font-mono" style={{ color: '#FBBF24', fontSize: '1rem', fontWeight: 800 }}>
                                    {selectedBug.severity || 'HIGH'}
                                </span>
                            </div>

                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                                <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>STATUS</span>
                                <span className="font-mono text-emerald" style={{ fontSize: '1rem', fontWeight: 800 }}>
                                    {selectedBug.status || 'Open'}
                                </span>
                            </div>
                        </div>

                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Related Execution IDs ({selectedBug.relatedExecutions ? selectedBug.relatedExecutions.length : 1}):</label>
                            <div className="font-mono" style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.65rem 0.85rem', borderRadius: '8px', color: '#818CF8', fontSize: '0.8rem', flexWrap: 'wrap', display: 'flex', gap: '0.5rem' }}>
                                {selectedBug.relatedExecutions && selectedBug.relatedExecutions.length > 0 ? (
                                    selectedBug.relatedExecutions.map(execId => (
                                        <span key={execId} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                            {execId}
                                        </span>
                                    ))
                                ) : (
                                    <span>{selectedBug.executionId}</span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="qa-field-group">
                                <label className="qa-field-label">Expected Behavior:</label>
                                <div className="qa-input" style={{ color: '#FBBF24' }}>{selectedBug.expectedBehavior || 'HTTP 400 Bad Request'}</div>
                            </div>
                            <div className="qa-field-group">
                                <label className="qa-field-label">Actual Behavior:</label>
                                <div className="qa-input" style={{ color: '#F87171' }}>{selectedBug.actualBehavior || 'HTTP 200 OK'}</div>
                            </div>
                        </div>

                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Bug Description & Diagnostic Log:</label>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#FECACA', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                {selectedBug.description}
                            </div>
                        </div>

                        <div className="qa-field-group">
                            <label className="qa-field-label">Actual Response Body:</label>
                            <pre className="font-mono" style={{ background: 'rgba(0,0,0,0.6)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#34D399', margin: 0, maxHeight: '160px', overflowY: 'auto' }}>
                                {selectedBug.responseBody || '{"status": "success"}'}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QADetectedBugsPage;
