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
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    X,
    FileText,
    Eye,
    Globe,
    Smartphone,
    Terminal,
    Cpu,
    Shield
} from 'lucide-react';
import './QATestingHistoryPage.css';

const QATestingHistoryPage = () => {
    const [historyList, setHistoryList] = useState(getTestingHistory);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'AI' | 'Website' | 'App'
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PASS' | 'FAIL'
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Refresh listener for external test saves
    useEffect(() => {
        const handleUpdate = () => setHistoryList(getTestingHistory());
        window.addEventListener('qa_testing_history_updated', handleUpdate);
        return () => window.removeEventListener('qa_testing_history_updated', handleUpdate);
    }, []);

    // Filter logic
    const filteredHistory = historyList.filter(item => {
        const matchesQuery =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.target || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.question || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

        return matchesQuery && matchesType && matchesStatus;
    });

    // Delete single record
    const handleDeleteRecord = (id, e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete test record ${id}?`)) {
            const updated = deleteTestingRecord(id);
            setHistoryList(updated);
            if (selectedRecord?.id === id) {
                setSelectedRecord(null);
            }
        }
    };

    // Clear all history
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
                    <span className="qa-tag font-mono">MULTI-TESTING TYPE AUDIT TRAIL</span>
                    <h1 className="qa-history-page-title">Testing Execution History</h1>
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

            {/* Filter Controls & Type Selector Bar */}
            <div className="qa-card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    {/* Type Filter Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="font-mono text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, marginRight: '0.25rem' }}>TYPE:</span>
                        <button
                            className={`qa-type-filter-btn ${typeFilter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setTypeFilter('ALL')}
                        >
                            All ({historyList.length})
                        </button>
                        <button
                            className={`qa-type-filter-btn ${typeFilter === 'AI' ? 'active' : ''}`}
                            onClick={() => setTypeFilter('AI')}
                        >
                            <Terminal size={14} />
                            <span>AI Response ({historyList.filter(h => h.type === 'AI').length})</span>
                        </button>
                        <button
                            className={`qa-type-filter-btn ${typeFilter === 'Website' ? 'active' : ''}`}
                            onClick={() => setTypeFilter('Website')}
                        >
                            <Globe size={14} />
                            <span>Website ({historyList.filter(h => h.type === 'Website').length})</span>
                        </button>
                        <button
                            className={`qa-type-filter-btn ${typeFilter === 'App' ? 'active' : ''}`}
                            onClick={() => setTypeFilter('App')}
                        >
                            <Smartphone size={14} />
                            <span>App ({historyList.filter(h => h.type === 'App').length})</span>
                        </button>
                    </div>

                    {/* Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={15} className="text-muted" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="qa-select-sm"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                        </select>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                    <Search size={16} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search history by Test ID, Target URL/App, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="qa-input"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* History Table */}
            <div className="qa-card" style={{ padding: '1.25rem' }}>
                <div className="qa-table-wrapper">
                    <table className="qa-table qa-history-table">
                        <thead>
                            <tr>
                                <th style={{ width: '100px' }}>Test ID</th>
                                <th style={{ width: '100px' }}>Type</th>
                                <th style={{ width: '160px' }}>Target</th>
                                <th>Test Description</th>
                                <th style={{ width: '150px' }}>Date & Time</th>
                                <th style={{ width: '100px' }}>Status</th>
                                <th style={{ width: '80px' }}>Score</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                        No testing history records found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((item) => (
                                    <tr key={item.id} className={item.status === 'FAIL' ? 'tr-fail' : ''}>
                                        <td className="font-mono text-gold fw-bold">{item.id}</td>
                                        <td>
                                            <span className={`qa-badge ${item.type === 'AI' ? 'badge-pass' : item.type === 'Website' ? 'badge-warn' : 'badge-pass'}`}>
                                                {item.type || 'AI'}
                                            </span>
                                        </td>
                                        <td className="font-mono text-muted-fg" style={{ fontSize: '0.8rem' }}>
                                            {item.target || 'POST /api/messages'}
                                        </td>
                                        <td className="qa-history-desc" style={{ color: '#FFF' }}>
                                            {item.description || item.question}
                                        </td>
                                        <td className="font-mono text-muted-fg" style={{ fontSize: '0.8rem' }}>
                                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            {item.timestamp}
                                        </td>
                                        <td>
                                            <span className={`qa-badge ${item.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="font-mono fw-bold text-gold">{item.score}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <button
                                                    onClick={() => setSelectedRecord(item)}
                                                    className="qa-run-sm-btn"
                                                    title="View Full Test Details"
                                                >
                                                    <Eye size={13} />
                                                    <span>Details</span>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Test Result Modal */}
            {selectedRecord && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1.5rem'
                }}>
                    <div className="qa-card" style={{ width: '100%', maxWidth: '680px', background: '#141414', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #242424' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                    <span className="font-mono text-gold fw-bold" style={{ fontSize: '0.85rem' }}>{selectedRecord.id}</span>
                                    <span className="qa-badge badge-pass">{selectedRecord.type || 'AI'} TESTING</span>
                                    <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>• {selectedRecord.timestamp}</span>
                                </div>
                                <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.15rem' }}>Detailed Test Result</h3>
                            </div>
                            <button onClick={() => setSelectedRecord(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Metadata Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div className="qa-tag-item" style={{ padding: '0.75rem 1rem' }}>
                                <span className="qa-tag-label">Execution Status:</span>
                                <span className={`qa-badge ${selectedRecord.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`} style={{ marginTop: '0.25rem' }}>
                                    {selectedRecord.status}
                                </span>
                            </div>
                            <div className="qa-tag-item" style={{ padding: '0.75rem 1rem' }}>
                                <span className="qa-tag-label">Quality Score:</span>
                                <span className="qa-tag-value font-mono text-gold" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                                    {selectedRecord.score}
                                </span>
                            </div>
                            <div className="qa-tag-item" style={{ padding: '0.75rem 1rem' }}>
                                <span className="qa-tag-label">Severity Level:</span>
                                <span className="qa-tag-value font-mono text-warn" style={{ fontWeight: 700 }}>
                                    {selectedRecord.severity || 'Medium'}
                                </span>
                            </div>
                        </div>

                        {/* Target & Description */}
                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Target Endpoint / Spec Identifier:</label>
                            <div className="qa-input font-mono">{selectedRecord.target || 'POST /api/messages'}</div>
                        </div>

                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Test Requirement Description:</label>
                            <div className="qa-input">{selectedRecord.description || selectedRecord.question}</div>
                        </div>

                        {/* Question & AI Response payloads */}
                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Question / Ingress Requirement:</label>
                            <div className="qa-input font-mono" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                {selectedRecord.question}
                            </div>
                        </div>

                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">AI Response / Output Payload:</label>
                            <div className="qa-input font-mono" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                {selectedRecord.response}
                            </div>
                        </div>

                        {/* Identified Issues */}
                        <div className="qa-field-group" style={{ marginBottom: '1rem' }}>
                            <label className="qa-field-label">Identified Issues & Defects:</label>
                            {selectedRecord.issues && selectedRecord.issues.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#EF4444' }}>
                                    {selectedRecord.issues.map((iss, idx) => (
                                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{iss}</li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ color: '#10B981', fontSize: '0.85rem' }}>✓ No critical issues or security defects identified.</div>
                            )}
                        </div>

                        {/* Evaluation Feedback */}
                        <div className="qa-field-group">
                            <label className="qa-field-label">AI Evaluation Feedback:</label>
                            <div style={{ background: '#0D0D0D', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #222', color: '#DDD', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                {selectedRecord.feedback}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QATestingHistoryPage;
