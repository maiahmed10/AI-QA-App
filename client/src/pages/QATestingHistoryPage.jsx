import React, { useState, useEffect } from 'react';
import {
    getTestingHistory,
    deleteTestingRecord,
    clearTestingHistory
} from '../services/qaHistoryService';
import {
    History,
    Search,
    Filter,
    Trash2,
    Clock,
    X,
    Eye,
    Terminal,
    Bug
} from 'lucide-react';
import './QATestingHistoryPage.css';

const QATestingHistoryPage = () => {
    const [historyList, setHistoryList] = useState(getTestingHistory);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Refresh listener for external test saves
    useEffect(() => {
        const handleUpdate = () => setHistoryList(getTestingHistory());
        window.addEventListener('qa_testing_history_updated', handleUpdate);
        return () => window.removeEventListener('qa_testing_history_updated', handleUpdate);
    }, []);

    // Filter logic
    const filteredHistory = historyList.filter(item => {
        const matchesQuery =
            (item.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.testCaseId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.endpoint || item.target || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description || item.question || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
    const paginatedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleDeleteRecord = (id, e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete test execution record ${id}?`)) {
            const updated = deleteTestingRecord(id);
            setHistoryList(updated);
            if (selectedRecord?.id === id) {
                setSelectedRecord(null);
            }
        }
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all testing history records? This action cannot be undone.')) {
            const updated = clearTestingHistory();
            setHistoryList(updated);
            setSelectedRecord(null);
        }
    };

    return (
        <div className="qa-history-page-container">
            {/* Page Header */}
            <div className="qa-history-page-header">
                <div>
                    <span className="qa-tag font-mono">AUDIT TRAIL LOGS</span>
                    <h1 className="qa-history-page-title">
                        Execution History ({historyList.length} Total Executions)
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={handleClearAll}
                        className="qa-clear-all-btn"
                        disabled={historyList.length === 0}
                    >
                        <Trash2 size={15} />
                        <span>Clear History</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="qa-card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '420px' }}>
                        <Search size={16} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Search executions by Execution ID, Test Case ID, or Endpoint..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="qa-input"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={15} className="text-muted" />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="qa-select-sm"
                        >
                            <option value="ALL">All Executions ({historyList.length})</option>
                            <option value="PASS">PASS ({historyList.filter(h => h.status === 'PASS').length})</option>
                            <option value="FAIL">FAIL ({historyList.filter(h => h.status === 'FAIL').length})</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="qa-card" style={{ padding: '1.25rem' }}>
                <div className="qa-table-wrapper">
                    <table className="qa-table qa-history-table">
                        <thead>
                            <tr>
                                <th style={{ width: '110px' }}>Execution ID</th>
                                <th style={{ width: '90px' }}>Test Case ID</th>
                                <th>Test Description</th>
                                <th style={{ width: '80px' }}>Method</th>
                                <th>Endpoint</th>
                                <th style={{ width: '90px' }}>Status</th>
                                <th style={{ width: '120px' }}>HTTP Status</th>
                                <th style={{ width: '110px' }}>Response Time</th>
                                <th style={{ width: '140px' }}>Execution Date</th>
                                <th style={{ width: '90px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                                        No testing history records found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedHistory.map((item) => {
                                    const isFail = item.status === 'FAIL';

                                    return (
                                        <tr key={item.id} className={isFail ? 'tr-fail' : ''} onClick={() => setSelectedRecord(item)} style={{ cursor: 'pointer' }}>
                                            <td className="font-mono text-indigo fw-bold" style={{ fontSize: '0.85rem' }}>
                                                {item.id || item.executionId}
                                            </td>
                                            <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                                                {item.testCaseId || 'TC-001'}
                                            </td>
                                            <td className="fw-semibold" style={{ color: '#F8FAFC' }}>
                                                {item.description || item.question}
                                            </td>
                                            <td>
                                                <span className="mm-method-pill font-mono">{item.method || 'POST'}</span>
                                            </td>
                                            <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                                                {item.endpoint || item.target || '/api/messages'}
                                            </td>
                                            <td>
                                                <span className={`qa-badge ${isFail ? 'badge-fail' : 'badge-pass'}`}>
                                                    {isFail ? 'FAIL' : 'PASS'}
                                                </span>
                                            </td>
                                            <td className="font-mono" style={{ color: isFail ? '#F87171' : '#34D399', fontWeight: 600 }}>
                                                {item.httpStatus || item.httpCode || 'Not provided'}
                                            </td>
                                            <td className="font-mono text-muted">
                                                {item.responseTime || item.timeMs || 'Not provided'}
                                            </td>
                                            <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                                                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                {item.timestamp || item.date}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedRecord(item); }}
                                                        className="qa-run-sm-btn"
                                                        title="View Details"
                                                    >
                                                        <Eye size={13} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteRecord(item.id, e)}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredHistory.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span className="font-mono text-muted" style={{ fontSize: '0.85rem' }}>
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredHistory.length)} of {filteredHistory.length} Executions
                        </span>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="mm-btn-link font-mono"
                                style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
                            >
                                ← Previous
                            </button>
                            <span className="font-mono text-indigo" style={{ padding: '0.2rem 0.5rem', fontWeight: 700 }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="mm-btn-link font-mono"
                                style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Execution Modal */}
            {selectedRecord && (
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
                }} onClick={() => setSelectedRecord(null)}>
                    <div className="qa-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '750px', background: '#0F172A', border: `1px solid ${selectedRecord.status === 'FAIL' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                    <span className="font-mono text-indigo fw-bold" style={{ fontSize: '0.85rem' }}>{selectedRecord.id || selectedRecord.executionId}</span>
                                    <span className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>({selectedRecord.testCaseId || 'TC-001'})</span>
                                    <span className={`qa-badge ${selectedRecord.status === 'FAIL' ? 'badge-fail' : 'badge-pass'}`}>{selectedRecord.status}</span>
                                    <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>• {selectedRecord.timestamp || selectedRecord.date}</span>
                                </div>
                                <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.15rem' }}>Execution Detailed View</h3>
                            </div>
                            <button onClick={() => setSelectedRecord(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                                <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>HTTP STATUS</span>
                                <span className="font-mono" style={{ color: selectedRecord.status === 'FAIL' ? '#F87171' : '#34D399', fontSize: '1rem', fontWeight: 800 }}>
                                    {selectedRecord.httpStatus || selectedRecord.httpCode || 'Not provided'}
                                </span>
                            </div>

                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                                <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>RESPONSE TIME</span>
                                <span className="font-mono" style={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: 800 }}>
                                    {selectedRecord.responseTime || selectedRecord.timeMs || 'Not provided'}
                                </span>
                            </div>

                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                                <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>METHOD & ENDPOINT</span>
                                <span className="font-mono text-indigo" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                    {selectedRecord.method || 'POST'} {selectedRecord.endpoint || selectedRecord.target}
                                </span>
                            </div>
                        </div>

                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Test Case Description:</label>
                            <div className="qa-input" style={{ color: '#F8FAFC' }}>{selectedRecord.description || selectedRecord.question}</div>
                        </div>

                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Request Data Payload:</label>
                            <pre className="font-mono" style={{ background: 'rgba(0,0,0,0.5)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#818CF8', margin: 0 }}>
                                {selectedRecord.requestData || 'None'}
                            </pre>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="qa-field-group">
                                <label className="qa-field-label">Expected Behavior:</label>
                                <div className="qa-input" style={{ color: '#FBBF24' }}>{selectedRecord.expectedBehavior || selectedRecord.expectedStatus || 'HTTP 200 OK'}</div>
                            </div>
                            <div className="qa-field-group">
                                <label className="qa-field-label">Actual Behavior:</label>
                                <div className="qa-input" style={{ color: selectedRecord.status === 'FAIL' ? '#F87171' : '#34D399' }}>{selectedRecord.actualBehavior || selectedRecord.actualStatus || selectedRecord.httpStatus}</div>
                            </div>
                        </div>

                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Response Body / Payload:</label>
                            <pre className="font-mono" style={{ background: 'rgba(0,0,0,0.6)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#34D399', margin: 0, maxHeight: '160px', overflowY: 'auto' }}>
                                {typeof selectedRecord.responseBody === 'string' ? selectedRecord.responseBody : JSON.stringify(selectedRecord.responseBody || selectedRecord.response, null, 2)}
                            </pre>
                        </div>

                        {/* Linked Defect Card when execution failed */}
                        {(selectedRecord.status === 'FAIL' || selectedRecord.bugDescription) && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '1rem', borderRadius: '8px', color: '#F87171' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 800 }}>
                                    <Bug size={18} />
                                    <span>LINKED DEFECT LOGGED</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#FECACA' }}>
                                    {selectedRecord.bugDescription || selectedRecord.response || 'The actual API response did not satisfy expected behavior.'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QATestingHistoryPage;
