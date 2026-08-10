import React, { useEffect } from 'react';
import { Sparkles, Trash2, FileText, CornerDownLeft, Zap } from 'lucide-react';

const SAMPLE_TEMPLATES = [
    {
        title: '🔑 User Auth & Session',
        text: `User Authentication Specification:
1. User enters email and password to log in.
2. System validates credentials against database. If invalid, display error "Invalid email or password".
3. Lock account for 15 minutes after 5 failed login attempts.
4. On successful authentication, generate JWT token with 30-minute expiration.
5. User can trigger password reset via email link expiring in 1 hour.`
    },
    {
        title: '💳 Payment & Checkout',
        text: `E-Commerce Checkout & Payment Processing:
1. User selects item quantity, adds to cart, and proceeds to checkout.
2. System calculates total price including tax (14%) and shipping ($10 flat rate).
3. User enters credit card details (Number, Expiry, CVV).
4. System sends transaction payload to payment gateway API (Stripe/PayPal).
5. If payment succeeds, decrement inventory stock count, issue order ID, and send confirmation email.
6. If payment fails, display failure code and preserve cart items.`
    },
    {
        title: '📦 Inventory & Order Management',
        text: `Real-time Inventory Management:
1. Warehouse managers can update stock levels for products.
2. If stock drops below 10 units, send low-stock alert email to admin.
3. System must prevent backordering when stock reaches 0 units.
4. Support CSV bulk import for stock level updates up to 10,000 SKUs.`
    },
    {
        title: '🛡️ Role-Based Access Control',
        text: `RBAC Authorization System:
1. Roles: Admin, Manager, Standard User, Guest.
2. Admins can view, edit, delete any user account and assign roles.
3. Managers can view team reports and edit project settings, but cannot delete accounts.
4. Standard Users have read/write access only to their own profile and assigned tasks.
5. Guests have read-only public access.`
    }
];

const QARequirementInput = ({
    requirement,
    setRequirement,
    onAnalyze,
    isLoading,
    activeMode,
}) => {
    // Handle Ctrl+Enter / Cmd+Enter keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (requirement.trim() && !isLoading) {
                    e.preventDefault();
                    onAnalyze();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [requirement, isLoading, onAnalyze]);

    const wordCount = requirement.trim() ? requirement.trim().split(/\s+/).length : 0;
    const charCount = requirement.length;

    return (
        <div className="qa-input-card">
            <div className="qa-input-header">
                <div className="qa-input-label">
                    <FileText size={18} style={{ color: '#E0AA3E' }} />
                    <span>Software Requirement Specification</span>
                </div>

                {/* Sample Templates */}
                <div className="qa-template-chips">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presets:</span>
                    {SAMPLE_TEMPLATES.map((tmpl, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="qa-chip"
                            onClick={() => setRequirement(tmpl.text)}
                            title="Insert sample requirement preset"
                        >
                            {tmpl.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Textarea Input */}
            <div className="qa-textarea-wrapper">
                <textarea
                    className="qa-textarea"
                    placeholder="Enter software requirement description, user story, PRD section, or API specification here... (e.g. 'Users must be able to reset their password using an email link that expires in 15 minutes...')"
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    disabled={isLoading}
                />
            </div>

            {/* Footer Toolbar */}
            <div className="qa-input-footer">
                <div className="qa-input-stats">
                    <span>{charCount} characters</span>
                    <span>•</span>
                    <span>{wordCount} words</span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-muted)' }}>Shortcut: <kbd style={{ background: '#262626', padding: '1px 5px', borderRadius: '4px' }}>Ctrl + Enter</kbd></span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {requirement.trim() && (
                        <button
                            type="button"
                            className="qa-btn-sm"
                            onClick={() => setRequirement('')}
                            disabled={isLoading}
                            title="Clear input text"
                        >
                            <Trash2 size={15} />
                            <span>Clear</span>
                        </button>
                    )}

                    <button
                        type="button"
                        className="qa-btn-analyze"
                        onClick={onAnalyze}
                        disabled={isLoading || !requirement.trim()}
                    >
                        {isLoading ? (
                            <>
                                <span className="qa-spinner-ring" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                                <span>Analyzing Requirement...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                <span>Analyze Requirement</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QARequirementInput;
