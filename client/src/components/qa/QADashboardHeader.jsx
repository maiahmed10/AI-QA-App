import React from 'react';
import { ShieldCheck, Settings, History, Download, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';
import { getWebhookConfig } from '../../config/webhookConfig';

const QADashboardHeader = ({
    onOpenSettings,
    onOpenHistory,
    onExportReport,
    historyCount = 0,
    activeMode = 'live',
}) => {
    const config = getWebhookConfig();
    const hasWebhookUrl = Boolean(config.url && config.url.trim());

    return (
        <header className="qa-header">
            <div className="qa-header-title">
                <div className="qa-header-icon" title="AI QA Suite">
                    <ShieldCheck size={26} />
                </div>
                <div>
                    <h1 className="qa-header-h1">AI QA Testing Assistant</h1>
                    <div className="qa-header-subtitle">
                        Analyze software requirements & generate test cases, edge scenarios, risks & quality specs
                    </div>
                </div>
            </div>

            <div className="qa-header-actions">
                {/* Status Indicator */}
                <div
                    className={`qa-status-badge ${!hasWebhookUrl ? 'unconfigured' : (activeMode === 'demo' ? 'demo' : 'connected')}`}
                    onClick={onOpenSettings}
                    title="Click to configure API Webhook Endpoint"
                >
                    <span className="qa-status-dot" />
                    <span>
                        {!hasWebhookUrl
                            ? 'Webhook API Unconfigured'
                            : (activeMode === 'demo' ? 'Demo / Preview Mode' : 'Webhook API Connected')}
                    </span>
                </div>

                {/* History Drawer Button */}
                <button
                    className="qa-btn-sm"
                    onClick={onOpenHistory}
                    title="View past requirement analyses"
                >
                    <History size={16} />
                    <span>History ({historyCount})</span>
                </button>

                {/* Export Options */}
                <button
                    className="qa-btn-sm"
                    onClick={onExportReport}
                    title="Export test suite & risk analysis"
                >
                    <Download size={16} />
                    <span>Export</span>
                </button>

                {/* Settings Modal Button */}
                <button
                    className="qa-btn-sm qa-btn-primary-sm"
                    onClick={onOpenSettings}
                    title="Configure Webhook Endpoint & Headers"
                >
                    <Settings size={16} />
                    <span>Webhook Settings</span>
                </button>
            </div>
        </header>
    );
};

export default QADashboardHeader;
