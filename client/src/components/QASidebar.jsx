import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQAAuth } from '../context/QAAuthContext';
import {
    LayoutDashboard,
    Sparkles,
    FileCode2,
    History,
    Bug,
    FileText,
    Settings,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Sun,
    Moon,
    X,
    Shield
} from 'lucide-react';
import './QASidebar.css';

const QASidebar = () => {
    const { user, logout, theme, toggleTheme } = useQAAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Persistent Collapsible Sidebar state
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('qa_sidebar_collapsed') === 'true';
    });

    // Help Modal state
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('qa_sidebar_collapsed', String(next));
            window.dispatchEvent(new CustomEvent('qa_sidebar_toggle', { detail: { collapsed: next } }));
            return next;
        });
    };

    return (
        <>
            <aside className={`qa-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                {/* Collapse / Expand Toggle Button */}
                <button
                    onClick={toggleCollapse}
                    className="qa-sidebar-toggle-btn"
                    title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    aria-label="Toggle Sidebar"
                >
                    {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                </button>

                {/* Top Brand Logo */}
                <div className="qa-sidebar-brand" onClick={() => navigate('/dashboard')}>
                    <div className="qa-sidebar-logo-badge">
                        <Sparkles size={20} className="qa-spark-icon" />
                    </div>
                    {!isCollapsed && (
                        <div className="qa-brand-text">
                            <h2 className="qa-brand-title">AI QA</h2>
                            <span className="qa-brand-subtitle">AI Testing Platform</span>
                        </div>
                    )}
                </div>

                {/* Navigation Menu Links */}
                <nav className="qa-sidebar-nav">
                    {/* SECTION 1: OVERVIEW */}
                    <div className="qa-nav-section">
                        {!isCollapsed && <span className="qa-nav-section-title">OVERVIEW</span>}
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) => `qa-nav-item ${isActive || location.pathname === '/' ? 'active' : ''}`}
                            title={isCollapsed ? 'Dashboard' : undefined}
                        >
                            <LayoutDashboard size={18} className="qa-nav-icon" />
                            {!isCollapsed && <span>Dashboard</span>}
                        </NavLink>
                    </div>

                    {/* SECTION 2: TESTING */}
                    <div className="qa-nav-section">
                        {!isCollapsed && <span className="qa-nav-section-title">TESTING</span>}
                        <NavLink
                            to="/ai-qa-testing"
                            className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                            title={isCollapsed ? 'New Test' : undefined}
                        >
                            <Sparkles size={18} className="qa-nav-icon icon-ai" />
                            {!isCollapsed && (
                                <div className="qa-nav-item-content">
                                    <span>New Test</span>
                                    <span className="qa-nav-badge">AI</span>
                                </div>
                            )}
                        </NavLink>

                        <NavLink
                            to="/test-cases"
                            className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                            title={isCollapsed ? 'Test Cases' : undefined}
                        >
                            <FileCode2 size={18} className="qa-nav-icon" />
                            {!isCollapsed && <span>Test Cases</span>}
                        </NavLink>

                        <NavLink
                            to="/testing-history"
                            className={({ isActive }) => `qa-nav-item ${isActive || location.pathname === '/history' || location.pathname === '/test-results' ? 'active' : ''}`}
                            title={isCollapsed ? 'Execution History' : undefined}
                        >
                            <History size={18} className="qa-nav-icon" />
                            {!isCollapsed && <span>Execution History</span>}
                        </NavLink>
                    </div>

                    {/* SECTION 3: ANALYSIS */}
                    <div className="qa-nav-section">
                        {!isCollapsed && <span className="qa-nav-section-title">ANALYSIS</span>}
                        <NavLink
                            to="/bugs"
                            className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                            title={isCollapsed ? 'Detected Bugs' : undefined}
                        >
                            <Bug size={18} className="qa-nav-icon icon-bug" />
                            {!isCollapsed && <span>Detected Bugs</span>}
                        </NavLink>

                        <NavLink
                            to="/reports"
                            className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                            title={isCollapsed ? 'Reports' : undefined}
                        >
                            <FileText size={18} className="qa-nav-icon" />
                            {!isCollapsed && <span>Reports</span>}
                        </NavLink>
                    </div>

                    {/* PREFERENCES & HELP */}
                    <div className="qa-nav-section qa-nav-section-bottom">
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                            title={isCollapsed ? 'Settings' : undefined}
                        >
                            <Settings size={18} className="qa-nav-icon" />
                            {!isCollapsed && <span>Settings</span>}
                        </NavLink>

                        <button
                            type="button"
                            onClick={() => setIsHelpOpen(true)}
                            className="qa-nav-item qa-help-item"
                            title={isCollapsed ? 'Help' : undefined}
                        >
                            <HelpCircle size={18} className="qa-nav-icon" />
                            {!isCollapsed && <span>Help</span>}
                        </button>
                    </div>
                </nav>

                {/* Status Card (AI QA ENGINE: ● Connected) */}
                <div className="qa-sidebar-status-card">
                    <div className="qa-status-indicator font-mono">
                        <span className="qa-pulse-dot"></span>
                        {!isCollapsed ? (
                            <div className="qa-status-info">
                                <span className="qa-status-title">AI QA ENGINE</span>
                                <span className="qa-status-state">Connected</span>
                            </div>
                        ) : (
                            <span className="qa-status-mini-dot" title="AI QA ENGINE Connected"></span>
                        )}
                    </div>
                </div>

                {/* Footer User Profile & Theme Controls */}
                <div className="qa-sidebar-footer">
                    <button
                        onClick={toggleTheme}
                        className="qa-theme-toggle-btn"
                        title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                    >
                        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                        {!isCollapsed && <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>}
                    </button>

                    <div className="qa-sidebar-user">
                        <div className="qa-user-info">
                            <div className="qa-avatar">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            {!isCollapsed && (
                                <div className="qa-user-details">
                                    <span className="qa-user-name">{user?.name || 'Lead QA Engineer'}</span>
                                    <span className="qa-user-role">Developer Pro</span>
                                </div>
                            )}
                        </div>

                        <button onClick={logout} className="qa-logout-btn" title="Sign Out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Help & Documentation Modal */}
            {isHelpOpen && (
                <div className="qa-modal-backdrop" onClick={() => setIsHelpOpen(false)}>
                    <div className="qa-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="qa-modal-header">
                            <div className="qa-modal-title-group">
                                <HelpCircle size={22} className="qa-accent-icon" />
                                <div>
                                    <h3 className="qa-modal-title">AI QA Platform Help</h3>
                                    <p className="qa-modal-subtitle">Learn how to monitor, test, and analyze your API specifications with AI.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsHelpOpen(false)} className="qa-modal-close-btn">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="qa-modal-body">
                            <div className="qa-help-grid">
                                <div className="qa-help-card">
                                    <Sparkles size={20} className="qa-help-icon" />
                                    <h4>1. Quick AI Test Execution</h4>
                                    <p>Enter any API Endpoint URL and test requirement. The AI automatically executes test cases and logs detected defects.</p>
                                </div>

                                <div className="qa-help-card">
                                    <FileCode2 size={20} className="qa-help-icon" />
                                    <h4>2. Test Cases Management</h4>
                                    <p>Manage test cases, run individual HTTP requests, inspect actual vs expected JSON payloads, and track resolution statuses.</p>
                                </div>

                                <div className="qa-help-card">
                                    <Bug size={20} className="qa-help-icon" />
                                    <h4>3. Detected Bugs</h4>
                                    <p>View automatically flagged defects (e.g. empty string bypass, HTTP 200 on invalid payload) categorized by severity badges (Critical, High, Medium, Low).</p>
                                </div>

                                <div className="qa-help-card">
                                    <Shield size={20} className="qa-help-icon" />
                                    <h4>4. Webhook & Integration</h4>
                                    <p>Configure custom N8N/AI webhooks in Settings to sync test results to Jira, Slack, or GitHub CI/CD pipelines.</p>
                                </div>
                            </div>
                        </div>

                        <div className="qa-modal-footer">
                            <button onClick={() => setIsHelpOpen(false)} className="qa-primary-btn">
                                Got it, close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QASidebar;
