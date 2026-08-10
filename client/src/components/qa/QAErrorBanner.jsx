import React from 'react';
import { AlertOctagon, RefreshCw, Settings, PlayCircle } from 'lucide-react';

const QAErrorBanner = ({
    error,
    onRetry,
    onOpenSettings,
    onSwitchDemoMode,
}) => {
    if (!error) return null;

    const errorMsg = typeof error === 'string' ? error : error.message || 'Webhook API call failed';
    const statusCode = error?.statusCode;
    const targetUrl = error?.url;

    return (
        <div className="qa-error-banner">
            <AlertOctagon size={24} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />

            <div style={{ flex: 1 }}>
                <div className="qa-error-title">
                    Webhook Connection Failure {statusCode ? `(HTTP ${statusCode})` : ''}
                </div>
                <div style={{ fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                    {errorMsg}
                </div>

                {targetUrl && (
                    <div style={{ fontSize: '0.775rem', color: '#F87171', fontFamily: 'monospace', marginBottom: '0.75rem', wordBreak: 'break-all' }}>
                        Endpoint URL: {targetUrl}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <button className="qa-btn-sm" onClick={onRetry} style={{ background: '#EF4444', color: '#FFF', borderColor: '#EF4444' }}>
                        <RefreshCw size={14} />
                        <span>Retry Request</span>
                    </button>

                    <button className="qa-btn-sm" onClick={onOpenSettings}>
                        <Settings size={14} />
                        <span>Open Webhook Settings</span>
                    </button>

                    {onSwitchDemoMode && (
                        <button className="qa-btn-sm" onClick={onSwitchDemoMode}>
                            <PlayCircle size={14} />
                            <span>Try Demo / Preview Mode</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QAErrorBanner;
