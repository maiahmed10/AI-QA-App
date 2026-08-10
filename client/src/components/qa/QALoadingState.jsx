import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Sparkles, Cpu } from 'lucide-react';

const LOADING_STEPS = [
    'Sending payload to AI QA Agent Webhook...',
    'Parsing functional scope & target business logic...',
    'Generating functional & negative test matrix...',
    'Extracting edge cases & boundary scenarios...',
    'Identifying missing requirements & risk mitigations...',
    'Synthesizing final structured JSON report...'
];

const QALoadingState = ({ activeMode = 'live' }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="qa-loading-card">
            <div style={{ position: 'relative' }}>
                <div className="qa-spinner-ring" />
                <Cpu
                    size={26}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#E0AA3E',
                    }}
                />
            </div>

            <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: '#FFF' }}>
                    AI QA Agent Processing
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Evaluating software requirements across functional, boundary, security & risk dimensions
                </div>
            </div>

            <div className="qa-loading-steps">
                {LOADING_STEPS.map((stepText, idx) => {
                    const isDone = idx < currentStep;
                    const isActive = idx === currentStep;

                    return (
                        <div
                            key={idx}
                            className={`qa-loading-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                        >
                            {isDone ? (
                                <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                            ) : isActive ? (
                                <Loader2 size={16} className="animate-spin" style={{ color: '#E0AA3E', flexShrink: 0 }} />
                            ) : (
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #444', flexShrink: 0 }} />
                            )}
                            <span>{stepText}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QALoadingState;
