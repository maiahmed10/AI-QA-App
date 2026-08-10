import React, { useState } from 'react';
import { initialTestCasesData, LOCAL_API_ENDPOINT } from '../data/qaTestData';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Play,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Terminal,
    RefreshCw,
    X,
    Check
} from 'lucide-react';

const QATestCasesPage = () => {
    // Unique Test Cases State (4 defined test scenarios)
    const [testCases, setTestCases] = useState(initialTestCasesData);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);

    // Live Execution State per test case (does NOT duplicate test case records)
    const [executingId, setExecutingId] = useState(null);
    const [executionResults, setExecutionResults] = useState({});

    // Form State for Add / Edit
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        expectedResult: '',
        actualResult: '',
        status: 'PASS',
        payload: '{"message": "Sample Payload"}'
    });

    const filteredCases = testCases.filter((tc) => {
        const matchesQuery =
            tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tc.expectedResult.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || tc.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    // Open Add Modal
    const handleOpenAdd = () => {
        setFormData({
            id: `TC-00${testCases.length + 1}`,
            name: '',
            expectedResult: 'HTTP 200 OK Response',
            actualResult: 'Pending Live Execution',
            status: 'NOT EXECUTED',
            payload: '{"message": "New Test Message"}'
        });
        setEditingTestCase(null);
        setIsAddModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (tc) => {
        setEditingTestCase(tc);
        setFormData({
            id: tc.id,
            name: tc.name,
            expectedResult: tc.expectedResult,
            actualResult: tc.actualResult,
            status: tc.status,
            payload: tc.payload || '{"message": "Hello World"}'
        });
        setIsAddModalOpen(true);
    };

    // Delete Handler
    const handleDelete = (id) => {
        if (window.confirm(`Are you sure you want to delete test case ${id}?`)) {
            setTestCases((prev) => prev.filter((tc) => tc.id !== id));
        }
    };

    // Save (Add or Edit) Handler
    const handleSave = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        if (editingTestCase) {
            setTestCases((prev) =>
                prev.map((tc) => (tc.id === editingTestCase.id ? { ...tc, ...formData } : tc))
            );
        } else {
            setTestCases((prev) => [...prev, formData]);
        }
        setIsAddModalOpen(false);
    };

    // Run Single Live API Test (Evaluates PASS/FAIL based on expected vs actual without duplicating test cases)
    const handleRunLiveTest = async (tc) => {
        setExecutingId(tc.id);
        const startTime = Date.now();

        try {
            let bodyObj = { message: "Hello World" };
            try { bodyObj = JSON.parse(tc.payload || '{"message": "Hello World"}'); } catch (e) { }

            const res = await fetch(LOCAL_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyObj)
            });

            const duration = Date.now() - startTime;
            const resData = await res.json().catch(() => ({ message: 'Non-JSON response' }));

            // Evaluate PASS/FAIL status accurately against contract expectations
            let testStatus = 'PASS';
            const isNegativeValidationTest = tc.id === 'TC-002' || (tc.payload && tc.payload.includes('""'));

            if (isNegativeValidationTest) {
                // Expects HTTP 400. If HTTP 200 returned, validation failed (BUG-001)
                if (res.status === 200) {
                    testStatus = 'FAIL';
                } else if (res.status === 400) {
                    testStatus = 'PASS';
                }
            } else {
                // Positive test expects HTTP 200 OK
                if (res.ok) {
                    testStatus = 'PASS';
                } else {
                    testStatus = 'FAIL';
                }
            }

            setExecutionResults((prev) => ({
                ...prev,
                [tc.id]: {
                    status: testStatus,
                    httpCode: res.status,
                    timeMs: duration,
                    data: resData
                }
            }));

            // Update status in list without duplicating records
            setTestCases((prev) =>
                prev.map((item) =>
                    item.id === tc.id ? { ...item, status: testStatus, actualResult: `HTTP ${res.status} (${duration}ms)` } : item
                )
            );
        } catch (err) {
            setExecutionResults((prev) => ({
                ...prev,
                [tc.id]: { status: 'BLOCKED', httpCode: 0, timeMs: 0, data: { error: err.message } }
            }));
        } finally {
            setExecutingId(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#E2E8F0' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#E0AA3E', fontWeight: 700 }}>SUITE TEST MANAGEMENT</span>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                        Test Cases Workspace ({testCases.length} Unique Test Cases)
                    </h1>
                </div>

                <button
                    onClick={handleOpenAdd}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '9px',
                        background: 'linear-gradient(135deg, #E0AA3E, #B8860B)',
                        color: '#0F0F0F',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={16} />
                    <span>Add New Test Case</span>
                </button>
            </div>

            {/* Filter & Controls Bar */}
            <div className="qa-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '360px' }}>
                    <Search size={16} style={{ color: '#888' }} />
                    <input
                        type="text"
                        placeholder="Search test cases by ID or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="qa-input"
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={15} style={{ color: '#888' }} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="qa-select-sm"
                    >
                        <option value="ALL">All Statuses ({testCases.length})</option>
                        <option value="PASS">PASS ({testCases.filter(t => t.status === 'PASS').length})</option>
                        <option value="FAIL">FAIL ({testCases.filter(t => t.status === 'FAIL').length})</option>
                        <option value="NOT EXECUTED">NOT EXECUTED</option>
                    </select>
                </div>
            </div>

            {/* Unique Test Cases Table */}
            <div className="qa-card" style={{ padding: '1.25rem' }}>
                <div className="qa-table-wrapper">
                    <table className="qa-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px' }}>ID</th>
                                <th>Test Case Name</th>
                                <th>Expected Result</th>
                                <th>Actual Result</th>
                                <th style={{ width: '130px' }}>Status</th>
                                <th style={{ width: '170px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCases.map((tc) => {
                                const isExecuting = executingId === tc.id;
                                const execRes = executionResults[tc.id];

                                return (
                                    <tr key={tc.id} className={tc.status === 'FAIL' ? 'tr-fail' : ''}>
                                        <td className="font-mono text-gold fw-bold">{tc.id}</td>
                                        <td className="fw-semibold" style={{ color: '#FFF' }}>{tc.name}</td>
                                        <td className="text-muted-fg">{tc.expectedResult}</td>
                                        <td className="text-muted-fg">{execRes ? `HTTP ${execRes.httpCode} (${execRes.timeMs}ms)` : tc.actualResult}</td>
                                        <td>
                                            <span className={`qa-badge ${tc.status === 'PASS' ? 'badge-pass' : tc.status === 'FAIL' ? 'badge-fail' : 'badge-warn'}`}>
                                                {tc.status}
                                            </span>
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
                                                    <span>Run Live Test</span>
                                                </button>

                                                <button
                                                    onClick={() => handleOpenEdit(tc)}
                                                    style={{ background: '#1E1E1E', border: '1px solid #333', color: '#FFF', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="qa-card" style={{ width: '100%', maxWidth: '480px', background: '#141414', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>
                                {editingTestCase ? `Edit Test Case (${editingTestCase.id})` : 'Add New Test Case'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="qa-field-group">
                                <label className="qa-field-label">Test Case Name:</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="qa-input"
                                    required
                                />
                            </div>

                            <div className="qa-field-group">
                                <label className="qa-field-label">Expected Result:</label>
                                <input
                                    type="text"
                                    value={formData.expectedResult}
                                    onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                                    className="qa-input"
                                    required
                                />
                            </div>

                            <div className="qa-field-group">
                                <label className="qa-field-label">JSON Request Body Payload:</label>
                                <textarea
                                    value={formData.payload}
                                    onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                                    rows={3}
                                    className="qa-textarea font-mono"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: '1px solid #333', color: '#9CA3AF', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="qa-analyze-btn" style={{ width: 'auto' }}>
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
