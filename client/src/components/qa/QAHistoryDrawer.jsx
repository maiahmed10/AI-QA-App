import React from 'react';
import { X, History, Trash2, ArrowRight, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

const QAHistoryDrawer = ({
    isOpen,
    onClose,
    history = [],
    onLoadHistoryItem,
    onClearHistory,
}) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="drawer-backdrop" onClick={onClose} />
            <div className="customer-drawer open" style={{ width: '450px', maxWidth: '100vw' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <History size={22} style={{ color: '#E0AA3E' }} />
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFF' }}>
                            Analysis History ({history.length})
                        </h3>
                    </div>
                    <button className="qa-btn-sm" onClick={onClose} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {history.length > 0 ? (
                        history.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                style={{
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onClick={() => {
                                    onLoadHistoryItem(item);
                                    onClose();
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                                    <span style={{ color: '#60A5FA', fontWeight: 600 }}>Click to Load</span>
                                </div>

                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFF', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {item.requirement}
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span style={{ color: '#10B981' }}>
                                        ✓ {item.data?.functional_test_cases?.length || 0} Func Tests
                                    </span>
                                    <span style={{ color: '#6366F1' }}>
                                        • {item.data?.negative_test_cases?.length || 0} Neg Tests
                                    </span>
                                    <span style={{ color: '#EF4444' }}>
                                        • {item.data?.risks?.length || 0} Risks
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            No past history entries found. Analyze a requirement to save reports here.
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="qa-btn-sm" onClick={onClearHistory} style={{ color: '#EF4444', borderColor: '#EF4444' }}>
                            <Trash2 size={14} />
                            <span>Clear All History</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default QAHistoryDrawer;
