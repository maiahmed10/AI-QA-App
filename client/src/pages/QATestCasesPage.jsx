import React, { useState, useEffect } from 'react';
import { LOCAL_API_ENDPOINT } from '../data/qaTestData';
import { runRealHttpTestCase } from '../services/apiTestRunnerService';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Play,
    RefreshCw,
    X,
    Calendar
} from 'lucide-react';
import { getTestCases, addTestCase, deleteTestCase, saveAllTestCases } from '../services/qaTestCaseService';

const QATestCasesPage = () => {
    // Unique Test Cases State (Driven from single source of truth)
    const [testCases, setTestCases] = useState(() => getTestCases());
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);

    // Synchronize test cases when updated from any workspace runner
    useEffect(() => {
        const handleSync = () => {
            setTestCases(getTestCases());
        };
        window.addEventListener('qa_test_cases_updated', handleSync);
        return () => window.removeEventListener('qa_test_cases_updated', handleSync);
    }, []);

    // Live Execution State per test case
    const [executingId, setExecutingId] = useState(null);
    const [executionResults, setExecutionResults] = useState({});

    // Form State for Add / Edit
    const [formData, setFormData] = useState({
        id: '',
        description: '',
        type: 'Positive',
        method: 'POST',
        endpoint: '/api/messages',
        requestData: '{\n  "message": "New Test Message"\n}',
        expectedResult: 'HTTP 200 OK'
    });

    const filteredCases = testCases.filter((tc) => {
        const matchesQuery =
            (tc.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tc.description || tc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tc.endpoint || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'ALL' || (tc.type || 'Positive') === typeFilter;
        return matchesQuery && matchesType;
    });

    const handleOpenAdd = () => {
        setFormData({
            id: `TC-00${testCases.length + 1}`,
            description: '',
            type: 'Positive',
            method: 'POST',
            endpoint: '/api/messages',
            requestData: '{\n  "message": "New Test Message"\n}',
            expectedResult: 'HTTP 200 OK'
        });
        setEditingTestCase(null);
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (tc) => {
        setEditingTestCase(tc);
        setFormData({
            id: tc.id,
            description: tc.description || tc.name,
            type: tc.type || 'Positive',
            method: tc.method || 'POST',
            endpoint: tc.endpoint || '/api/messages',
            requestData: tc.requestData || tc.payload || '{\n  "message": "Hello World"\n}',
            expectedResult: tc.expectedResult || 'HTTP 200 OK'
        });
        setIsAddModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm(`Are you sure you want to delete test case ${id}?`)) {
            const updated = deleteTestCase(id);
            setTestCases(updated);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!formData.description.trim()) return;

        let updatedList;
        if (editingTestCase) {
            const current = getTestCases();
            updatedList = current.map((tc) => (tc.id === editingTestCase.id ? { ...tc, ...formData } : tc));
            saveAllTestCases(updatedList);
        } else {
            updatedList = addTestCase(formData);
        }
        setTestCases(updatedList);
        setIsAddModalOpen(false);
    };

    const handleRunLiveTest = async (tc) => {
        setExecutingId(tc.id);
        const targetUrl = tc.endpoint.startsWith('http') ? tc.endpoint : LOCAL_API_ENDPOINT;
        const result = await runRealHttpTestCase({ ...tc, name: tc.description, payload: tc.requestData }, targetUrl, true);

        setExecutionResults((prev) => ({
            ...prev,
            [tc.id]: {
                status: result.status,
                httpCode: result.httpCode,
                timeMs: result.timeMs,
                data: result.actualData,
                failureReason: result.failureReason
            }
        }));

        setTestCases((prev) =>
            prev.map((item) =>
                item.id === tc.id ? { ...item, status: result.status, actualResult: `HTTP ${result.httpCode}` } : item
            )
        );
        setExecutingId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#F8FAFC' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <span className="font-mono text-indigo" style={{ fontSize: '0.75rem', fontWeight: 700 }}>DYNAMIC SUITE</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                        Test Cases Workspace ({testCases.length} Unique Test Cases)
                    </h1>
                </div>

                <button
                    onClick={handleOpenAdd}
                    className="qa-primary-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={16} />
                    <span>Add New Test Case</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="qa-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '380px' }}>
                    <Search size={16} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search test cases by ID, description or endpoint..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="qa-input"
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={15} className="text-muted" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="qa-select-sm"
                    >
                        <option value="ALL">All Test Types ({testCases.length})</option>
                        <option value="Positive">Positive ({testCases.filter(t => t.type === 'Positive').length})</option>
                        <option value="Negative">Negative ({testCases.filter(t => t.type === 'Negative').length})</option>
                    </select>
                </div>
            </div>

            {/* Test Cases Table: Test Case ID | Description | Type | Method | Endpoint | Request Data | Expected Result | Creation Date | Actions */}
            <div className="qa-card" style={{ padding: '1.25rem' }}>
                <div className="qa-table-wrapper">
                    <table className="qa-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px' }}>Test Case ID</th>
                                <th>Description</th>
                                <th style={{ width: '90px' }}>Type</th>
                                <th style={{ width: '80px' }}>Method</th>
                                <th>Endpoint</th>
                                <th>Request Data</th>
                                <th>Expected Result</th>
                                <th style={{ width: '110px' }}>Creation Date</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCases.map((tc) => {
                                const isExecuting = executingId === tc.id;
                                const isNegative = tc.type === 'Negative';

                                return (
                                    <tr key={tc.id}>
                                        <td className="font-mono text-indigo fw-bold">{tc.id}</td>
                                        <td className="fw-semibold" style={{ color: '#F8FAFC' }}>{tc.description || tc.name}</td>
                                        <td>
                                            <span className={`qa-badge ${isNegative ? 'badge-fail' : 'badge-pass'}`}>
                                                {tc.type || (isNegative ? 'Negative' : 'Positive')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="mm-method-pill font-mono">{tc.method || 'POST'}</span>
                                        </td>
                                        <td className="font-mono text-muted-fg" style={{ fontSize: '0.8rem' }}>{tc.endpoint || '/api/messages'}</td>
                                        <td className="font-mono text-muted-fg" style={{ fontSize: '0.8rem' }}>{tc.requestData || tc.payload || 'None'}</td>
                                        <td className="text-muted-fg font-mono" style={{ fontSize: '0.825rem', color: (tc.expectedResult || '').includes('404') || (tc.expectedResult || '').includes('400') ? '#F87171' : '#34D399' }}>
                                            {tc.expectedResult}
                                        </td>
                                        <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                                            <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            {tc.creationDate || 'Aug 10, 2026'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <button
                                                    className="qa-run-sm-btn"
                                                    onClick={() => handleRunLiveTest(tc)}
                                                    disabled={isExecuting}
                                                    title="Run Live Test"
                                                >
                                                    {isExecuting ? <RefreshCw size={13} className="qa-spin" /> : <Play size={13} />}
                                                    <span>Run</span>
                                                </button>

                                                <button
                                                    onClick={() => handleOpenEdit(tc)}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#FFF', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                                                    title="Edit Test Case"
                                                >
                                                    <Edit2 size={13} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(tc.id)}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                                                    title="Delete Test Case"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Add / Edit */}
            {isAddModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="qa-card" style={{ width: '100%', maxWidth: '520px', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>
                                {editingTestCase ? `Edit Test Case (${editingTestCase.id})` : 'Add New Test Case'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="qa-field-group">
                                <label className="qa-field-label">Test Case Description:</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="qa-input"
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="qa-field-group">
                                    <label className="qa-field-label">Test Type:</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="qa-select-sm"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Positive">Positive</option>
                                        <option value="Negative">Negative</option>
                                    </select>
                                </div>

                                <div className="qa-field-group">
                                    <label className="qa-field-label">HTTP Method:</label>
                                    <select
                                        value={formData.method}
                                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                        className="qa-select-sm"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                    </select>
                                </div>
                            </div>

                            <div className="qa-field-group">
                                <label className="qa-field-label">Endpoint URL:</label>
                                <input
                                    type="text"
                                    value={formData.endpoint}
                                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                                    className="qa-input font-mono"
                                    required
                                />
                            </div>

                            <div className="qa-field-group">
                                <label className="qa-field-label">Expected Result / Behavior:</label>
                                <input
                                    type="text"
                                    value={formData.expectedResult}
                                    onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                                    className="qa-input"
                                    required
                                />
                            </div>

                            <div className="qa-field-group">
                                <label className="qa-field-label">Request Data / Payload:</label>
                                <textarea
                                    value={formData.requestData}
                                    onChange={(e) => setFormData({ ...formData, requestData: e.target.value })}
                                    rows={3}
                                    className="qa-textarea font-mono"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="qa-primary-btn">
                                    Save Test Case
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QATestCasesPage;
