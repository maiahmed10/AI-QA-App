import React from 'react';
import { ShieldAlert, ShieldCheck, Wrench } from 'lucide-react';

const QARisksCards = ({ risks = [] }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <ShieldAlert size={22} style={{ color: '#EF4444' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFF' }}>
                    Risk Assessment & Vulnerabilities ({risks.length})
                </h3>
            </div>

            <div className="qa-cards-grid">
                {risks.length > 0 ? (
                    risks.map((riskItem, idx) => {
                        const levelStr = String(riskItem.level || 'Medium').toLowerCase();
                        const levelClass = levelStr.includes('high') ? 'level-high' : levelStr.includes('low') ? 'level-low' : 'level-medium';
                        const badgeClass = levelStr.includes('high') ? 'high' : levelStr.includes('low') ? 'low' : 'medium';

                        return (
                            <div key={idx} className={`qa-risk-card ${levelClass}`}>
                                <div className="qa-risk-header">
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FFF' }}>
                                        {riskItem.title || `Risk Factor #${idx + 1}`}
                                    </div>
                                    <span className={`qa-risk-level-badge ${badgeClass}`}>
                                        {riskItem.level || 'Medium Risk'}
                                    </span>
                                </div>

                                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                                    {riskItem.description}
                                </div>

                                {riskItem.mitigation && (
                                    <div className="qa-risk-mitigation">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#A7F3D0', marginBottom: '0.2rem' }}>
                                            <Wrench size={14} />
                                            <span>Proposed Mitigation:</span>
                                        </div>
                                        <div>{riskItem.mitigation}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)' }}>
                        No critical technical risks identified.
                    </div>
                )}
            </div>
        </div>
    );
};

export default QARisksCards;
