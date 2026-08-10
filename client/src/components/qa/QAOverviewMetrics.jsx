import React from 'react';
import { CheckSquare, AlertOctagon, HelpCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

const QAOverviewMetrics = ({ metrics, activeTab, setActiveTab }) => {
    const {
        functionalCount = 0,
        negativeCount = 0,
        edgeCount = 0,
        missingCount = 0,
        riskCount = 0,
    } = metrics || {};

    const cards = [
        {
            id: 'functional',
            label: 'Functional Tests',
            value: functionalCount,
            icon: CheckSquare,
            type: 'func',
            targetTab: 'functional',
        },
        {
            id: 'negative',
            label: 'Negative Tests',
            value: negativeCount,
            icon: AlertOctagon,
            type: 'neg',
            targetTab: 'negative',
        },
        {
            id: 'edge',
            label: 'Edge Cases',
            value: edgeCount,
            icon: HelpCircle,
            type: 'edge',
            targetTab: 'edge',
        },
        {
            id: 'missing',
            label: 'Missing Requirements',
            value: missingCount,
            icon: AlertTriangle,
            type: 'missing',
            targetTab: 'missing',
        },
        {
            id: 'risks',
            label: 'Risks Identified',
            value: riskCount,
            icon: ShieldAlert,
            type: 'risks',
            targetTab: 'risks',
        },
    ];

    return (
        <section className="qa-metrics-grid">
            {cards.map((card) => {
                const IconComponent = card.icon;
                const isActive = activeTab === card.targetTab;

                return (
                    <div
                        key={card.id}
                        className={`qa-metric-card ${card.type} ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveTab && setActiveTab(card.targetTab)}
                        title={`Click to view ${card.label}`}
                    >
                        <div className="qa-metric-info">
                            <div className="qa-metric-value">{card.value}</div>
                            <div className="qa-metric-label">{card.label}</div>
                        </div>

                        <div className="qa-metric-icon">
                            <IconComponent size={22} />
                        </div>
                    </div>
                );
            })}
        </section>
    );
};

export default QAOverviewMetrics;
