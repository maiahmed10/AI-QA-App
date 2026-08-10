import React, { useState } from 'react';
import { useQAAuth } from '../context/QAAuthContext';
import { getWebhookConfig, saveWebhookConfig } from '../config/webhookConfig';
import { Moon, Sun, Save, User, Shield, Terminal, Check } from 'lucide-react';

const QASettingsPage = () => {
    const { user, theme, toggleTheme } = useQAAuth();
    const [webhookUrl, setWebhookUrl] = useState(() => getWebhookConfig().url);
    const [isSaved, setIsSaved] = useState(false);

    const handleSaveSettings = (e) => {
        e.preventDefault();
        saveWebhookConfig({ url: webhookUrl });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#E2E8F0', maxWidth: '800px' }}>
            {/* Header */}
            <div>
                <span className="font-mono" style={{ fontSize: '0.75rem', color: '#E0AA3E', fontWeight: 700 }}>SYSTEM & USER PREFERENCES</span>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>Application Settings</h1>
            </div>

            {/* Section 1: Appearance & Theme */}
            <div className="qa-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ color: '#FFF', margin: '0 0 0.25rem', fontSize: '1rem' }}>Interface Theme Mode</h3>
                        <p style={{ color: '#888', margin: 0, fontSize: '0.825rem' }}>
                            Switch between Executive Dark Mode and Clean Light Mode
                        </p>
                    </div>

                    <button
                        onClick={toggleTheme}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '9px',
                            background: theme === 'dark' ? 'rgba(224, 170, 62, 0.15)' : '#E2E8F0',
                            border: theme === 'dark' ? '1px solid rgba(224, 170, 62, 0.3)' : '1px solid #CBD5E1',
                            color: theme === 'dark' ? '#E0AA3E' : '#0F172A',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        <span>{theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}</span>
                    </button>
                </div>
            </div>

            {/* Section 2: Account Profile Settings */}
            <div className="qa-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ color: '#FFF', margin: '0 0 1rem', fontSize: '1rem' }}>User Profile & Account</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="qa-field-group">
                        <label className="qa-field-label">User Name:</label>
                        <input type="text" value={user?.name || 'QA Engineer'} readOnly className="qa-input" style={{ opacity: 0.8 }} />
                    </div>

                    <div className="qa-field-group">
                        <label className="qa-field-label">Email Address:</label>
                        <input type="email" value={user?.email || 'admin@micromind.qa'} readOnly className="qa-input" style={{ opacity: 0.8 }} />
                    </div>

                    <div className="qa-field-group">
                        <label className="qa-field-label">System Role Scope:</label>
                        <input type="text" value={user?.role || 'Lead QA Engineer'} readOnly className="qa-input font-mono" style={{ opacity: 0.8 }} />
                    </div>
                </div>
            </div>

            {/* Section 3: Webhook Endpoint Settings */}
            <div className="qa-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ color: '#FFF', margin: '0 0 1rem', fontSize: '1rem' }}>AI QA Webhook Configuration</h3>

                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="qa-field-group">
                        <label className="qa-field-label">Active QA Webhook URL:</label>
                        <input
                            type="text"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="qa-input font-mono"
                            placeholder="https://core.aimicromind.com/webhook/..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="submit" className="qa-analyze-btn" style={{ width: 'auto' }}>
                            {isSaved ? (
                                <>
                                    <Check size={16} />
                                    <span>Settings Saved!</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save Webhook Configuration</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QASettingsPage;
