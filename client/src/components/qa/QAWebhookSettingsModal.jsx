import React, { useState } from 'react';
import { X, Save, Activity, CheckCircle2, AlertCircle, Terminal, HelpCircle, Key, Link2 } from 'lucide-react';
import { getWebhookConfig, saveWebhookConfig } from '../../config/webhookConfig';
import { testWebhookConnection } from '../../services/qaWebhookService';

const QAWebhookSettingsModal = ({ isOpen, onClose, onConfigSaved }) => {
    const initialConfig = getWebhookConfig();

    const [url, setUrl] = useState(initialConfig.url || '');
    const [headersStr, setHeadersStr] = useState(
        JSON.stringify(initialConfig.headers || { 'Content-Type': 'application/json' }, null, 2)
    );
    const [mode, setMode] = useState(initialConfig.mode || 'live');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [jsonError, setJsonError] = useState(null);

    if (!isOpen) return null;

    const handleTestConnection = async () => {
        if (!url.trim()) {
            setTestResult({ success: false, message: 'Please enter a valid Webhook URL first.' });
            return;
        }

        let parsedHeaders = {};
        try {
            parsedHeaders = JSON.parse(headersStr);
            setJsonError(null);
        } catch (e) {
            setJsonError('Invalid JSON format in Webhook Headers field.');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        const result = await testWebhookConnection(url.trim(), parsedHeaders);
        setIsTesting(false);
        setTestResult(result);
    };

    const handleSave = () => {
        let parsedHeaders = { 'Content-Type': 'application/json' };
        if (headersStr.trim()) {
            try {
                parsedHeaders = JSON.parse(headersStr);
                setJsonError(null);
            } catch (e) {
                setJsonError('Invalid JSON format in Webhook Headers field.');
                return;
            }
        }

        saveWebhookConfig({
            url: url.trim(),
            headers: parsedHeaders,
            mode,
        });

        if (onConfigSaved) onConfigSaved({ url: url.trim(), headers: parsedHeaders, mode });
        onClose();
    };

    const sampleCurl = `curl -X POST "${url || 'https://n8n.example.com/webhook/qa-agent'}" \\
  -H "Content-Type: application/json" \\
  -d '{"requirement": "User authentication with JWT and lockout after 5 failed attempts"}'`;

    return (
        <div className="qa-modal-backdrop" onClick={onClose}>
            <div className="qa-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="qa-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Link2 size={22} style={{ color: '#E0AA3E' }} />
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFF' }}>
                            Webhook API Configuration
                        </h3>
                    </div>
                    <button
                        className="qa-btn-sm"
                        onClick={onClose}
                        style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="qa-modal-body">
                    {/* Integration Mode Switcher */}
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                            Execution Engine Mode
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <button
                                type="button"
                                className={`qa-btn-sm ${mode === 'live' ? 'qa-btn-primary-sm' : ''}`}
                                onClick={() => setMode('live')}
                                style={{ justifyContent: 'center', padding: '0.625rem' }}
                            >
                                ⚡ Live Webhook API
                            </button>
                            <button
                                type="button"
                                className={`qa-btn-sm ${mode === 'demo' ? 'qa-btn-primary-sm' : ''}`}
                                onClick={() => setMode('demo')}
                                style={{ justifyContent: 'center', padding: '0.625rem' }}
                            >
                                🧪 Demo / Mock Mode
                            </button>
                        </div>
                    </div>

                    {/* Webhook Endpoint URL */}
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                            Webhook Endpoint API URL *
                        </label>
                        <input
                            type="url"
                            className="qa-textarea"
                            style={{ minHeight: 'auto', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                            placeholder="https://n8n.your-domain.com/webhook/qa-agent or https://make.com/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            The application sends a <code>POST</code> request with <code>&#123;"requirement": "..."&#125;</code> payload to this URL.
                        </div>
                    </div>

                    {/* Custom HTTP Headers */}
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                            HTTP Headers (JSON Format)
                        </label>
                        <textarea
                            className="qa-textarea"
                            style={{ minHeight: '80px', fontFamily: 'monospace', fontSize: '0.825rem' }}
                            placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer YOUR_TOKEN"\n}'
                            value={headersStr}
                            onChange={(e) => setHeadersStr(e.target.value)}
                        />
                        {jsonError && (
                            <div style={{ fontSize: '0.775rem', color: '#EF4444', marginTop: '0.25rem' }}>
                                {jsonError}
                            </div>
                        )}
                    </div>

                    {/* Test Connection Button */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <button
                                type="button"
                                className="qa-btn-sm"
                                onClick={handleTestConnection}
                                disabled={isTesting}
                            >
                                {isTesting ? (
                                    <>
                                        <span className="qa-spinner-ring" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                                        <span>Pinging Webhook...</span>
                                    </>
                                ) : (
                                    <>
                                        <Activity size={15} style={{ color: '#10B981' }} />
                                        <span>Test Endpoint Ping</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {testResult && (
                            <div style={{
                                marginTop: '0.625rem',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                fontSize: '0.825rem',
                                color: testResult.success ? '#A7F3D0' : '#FCA5A5'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    <span>{testResult.message}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payload Inspector / Curl Guide */}
                    <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            <Terminal size={14} />
                            <span>EXPECTED PAYLOAD CURL FORMAT</span>
                        </div>
                        <pre style={{ margin: 0, fontSize: '0.75rem', color: '#60A5FA', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {sampleCurl}
                        </pre>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="qa-modal-footer">
                    <button className="qa-btn-sm" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="qa-btn-sm qa-btn-primary-sm" onClick={handleSave}>
                        <Save size={16} />
                        <span>Save Webhook Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QAWebhookSettingsModal;
