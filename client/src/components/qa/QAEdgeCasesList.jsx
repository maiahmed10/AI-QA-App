import React, { useState } from 'react';
import { HelpCircle, Copy, Check, Filter } from 'lucide-react';

const QAEdgeCasesList = ({ edgeCases = [] }) => {
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [copiedAll, setCopiedAll] = useState(false);

    const handleCopyItem = (item, idx) => {
        navigator.clipboard.writeText(item);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleCopyAll = () => {
        const text = edgeCases.map((ec, i) => `${i + 1}. ${ec}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <HelpCircle size={22} style={{ color: '#A855F7' }} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFF' }}>
                        Edge Cases & Boundary Conditions ({edgeCases.length})
                    </h3>
                </div>

                {edgeCases.length > 0 && (
                    <button className="qa-btn-sm" onClick={handleCopyAll}>
                        {copiedAll ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                        <span>{copiedAll ? 'Copied All' : 'Copy All Edge Cases'}</span>
                    </button>
                )}
            </div>

            <div className="qa-edge-list">
                {edgeCases.length > 0 ? (
                    edgeCases.map((item, idx) => (
                        <div key={idx} className="qa-edge-item">
                            <div className="qa-edge-num">{idx + 1}</div>
                            <div style={{ flex: 1, fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                                {item}
                            </div>
                            <button
                                className="qa-btn-sm"
                                onClick={() => handleCopyItem(item, idx)}
                                title="Copy edge case"
                                style={{ padding: '0.3rem 0.5rem' }}
                            >
                                {copiedIdx === idx ? (
                                    <Check size={14} style={{ color: '#10B981' }} />
                                ) : (
                                    <Copy size={14} />
                                )}
                            </button>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)' }}>
                        No specific edge cases identified.
                    </div>
                )}
            </div>
        </div>
    );
};

export default QAEdgeCasesList;
