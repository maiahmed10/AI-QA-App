import React, { useState } from 'react';
import { Sparkles, Copy, Check, Columns, FileText, ArrowRight } from 'lucide-react';

const QAImprovedRequirementsList = ({ improvedRequirements = [], originalRequirement = '' }) => {
    const [copiedAll, setCopiedAll] = useState(false);
    const [showDiffView, setShowDiffView] = useState(false);

    const handleCopyAll = () => {
        const text = improvedRequirements.join('\n\n');
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Sparkles size={22} style={{ color: '#E0AA3E' }} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFF' }}>
                        Improved & Hardened Requirements ({improvedRequirements.length})
                    </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <button
                        className="qa-btn-sm"
                        onClick={() => setShowDiffView(!showDiffView)}
                        title="Toggle Side-by-Side Comparison with Original Input"
                    >
                        <Columns size={15} />
                        <span>{showDiffView ? 'Standard List View' : 'Compare Diff View'}</span>
                    </button>

                    {improvedRequirements.length > 0 && (
                        <button className="qa-btn-sm" onClick={handleCopyAll}>
                            {copiedAll ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                            <span>{copiedAll ? 'Copied Improved Spec' : 'Copy Improved Spec'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Side-by-Side Comparison View */}
            {showDiffView && originalRequirement ? (
                <div className="grid-cols-2" style={{ gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            <FileText size={16} />
                            <span>ORIGINAL INPUT REQUIREMENT</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.6, background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            {originalRequirement}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            <Sparkles size={16} />
                            <span>AI HARDENED SPECIFICATION</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {improvedRequirements.map((item, idx) => (
                                <div key={idx} style={{ fontSize: '0.875rem', color: '#A7F3D0', lineHeight: 1.5, background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Numbered List View */
                <div className="qa-improved-list">
                    {improvedRequirements.length > 0 ? (
                        improvedRequirements.map((item, idx) => (
                            <div key={idx} className="qa-improved-item">
                                <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 500 }}>
                                    {item}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)' }}>
                            No refined requirements generated.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QAImprovedRequirementsList;
