/**
 * Centralized Webhook Configuration for AI QA Testing Assistant.
 * Keeps the API/Webhook URL configurable in one place, backed by localStorage persistence.
 */

const STORAGE_KEY_URL = 'qa_assistant_webhook_url';
const STORAGE_KEY_HEADERS = 'qa_assistant_webhook_headers';
const STORAGE_KEY_MODE = 'qa_assistant_webhook_mode'; // 'live' or 'demo'

// Default fallback webhook URL (can be set via .env or user input in settings modal)
export const DEFAULT_WEBHOOK_URL = import.meta.env.VITE_QA_WEBHOOK_URL || 'https://core.aimicromind.com/webhook/61ed0540-8d82-41e9-aeb6-2ecc7b6fb1b8/webhook';

export const getWebhookConfig = () => {
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const savedHeaders = localStorage.getItem(STORAGE_KEY_HEADERS);
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE);

    let parsedHeaders = { 'Content-Type': 'application/json' };
    if (savedHeaders) {
        try {
            parsedHeaders = JSON.parse(savedHeaders);
        } catch (e) {
            console.warn('Failed to parse webhook headers from localStorage:', e);
        }
    }

    const effectiveUrl = (savedUrl && savedUrl.trim() !== '') ? savedUrl : DEFAULT_WEBHOOK_URL;

    return {
        url: effectiveUrl,
        headers: parsedHeaders,
        mode: savedMode || 'live',
    };
};

export const saveWebhookConfig = ({ url, headers, mode }) => {
    if (url !== undefined) {
        localStorage.setItem(STORAGE_KEY_URL, url.trim());
    }
    if (headers !== undefined) {
        localStorage.setItem(STORAGE_KEY_HEADERS, typeof headers === 'string' ? headers : JSON.stringify(headers));
    }
    if (mode !== undefined) {
        localStorage.setItem(STORAGE_KEY_MODE, mode);
    }
};

export const isWebhookConfigured = () => {
    const config = getWebhookConfig();
    return Boolean(config.url && config.url.trim().length > 0);
};
