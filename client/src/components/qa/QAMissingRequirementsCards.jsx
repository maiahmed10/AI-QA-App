import React from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';

const QAMissingRequirementsCards = ({ missingRequirements = [] }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <AlertTriangle size={22} style={{ color: '#F59E0B' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFF' }}>
                    Missing Requirements & Specification Gaps ({missingRequirements.length})
                </h3>
            </div>

            <div className="qa-cards-grid">
                {missingRequirements.length > 0 ? (
                    missingRequirements.map((item, idx) => (
                        <div key={idx} className="qa-warning-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B', fontWeight: 700, fontSize: '0.85rem' }}>
                                <AlertTriangle size={16} />
                                <span>SPEC GAP #{idx + 1}</span>
                            </div>

                            <div style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                                {item}
                            </div>

                            <div style={{
                                marginTop: 'auto',
                                paddingTop: '0.75rem',
                                borderTop: '1px dashed rgba(245, 158, 11, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8rem',
                                color: '#FBBF24'
                            }}>
                                <Lightbulb size={14} />
                                <span>Recommendation: Clarify with Product Manager / Architect</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)' }}>
                        No missing requirements detected. The specification is comprehensive.
                    </div>
                )}
            </div>
        </div>
    );
};

export default QAMissingRequirementsCards;
