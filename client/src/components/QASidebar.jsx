import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQAAuth } from '../context/QAAuthContext';
import {
    BarChart2,
    Zap,
    Bot,
    ListTodo,
    History,
    Clock,
    Settings,
    LogOut,
    Cpu,
    UserCheck,
    Sun,
    Moon
} from 'lucide-react';
import './QASidebar.css';

const QASidebar = () => {
    const { user, logout, theme, toggleTheme } = useQAAuth();

    return (
        <aside className="qa-sidebar">
            {/* Top Brand Logo */}
            <div className="qa-sidebar-brand">
                <div className="qa-sidebar-logo font-mono">
                    <Cpu size={22} />
                </div>
                <div>
                    <span className="qa-sidebar-tag font-mono">MICROMIND</span>
                    <h2 className="qa-sidebar-title">QA Suite v2.0</h2>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="qa-sidebar-nav">
                <span className="qa-nav-section-title font-mono">MAIN MENU</span>

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                >
                    <BarChart2 size={18} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/ai-qa-testing"
                    className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                >
                    <Zap size={18} />
                    <span>AI QA Testing</span>
                </NavLink>

                <NavLink
                    to="/ai-assistant"
                    className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                >
                    <Bot size={18} />
                    <span>AI Assistant</span>
                </NavLink>

                <NavLink
                    to="/test-cases"
                    className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                >
                    <ListTodo size={18} />
                    <span>Test Cases</span>
                </NavLink>

                <NavLink
                    to="/test-results"
                    className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                >
                    <History size={18} />
                    <span>Test Results</span>
                </NavLink>

                <NavLink
                    to="/testing-history"
                    className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                >
                    <Clock size={18} />
                    <span>Testing History</span>
                </NavLink>

                <span className="qa-nav-section-title font-mono" style={{ marginTop: '1.25rem' }}>PREFERENCES</span>

                <NavLink
                    to="/settings"
                    className={({ isActive }) => `qa-nav-item ${isActive ? 'active' : ''}`}
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </NavLink>
            </nav>

            {/* Bottom Profile & Actions Footer */}
            <div className="qa-sidebar-footer">
                {/* Theme Toggle Button */}
                <button onClick={toggleTheme} className="qa-theme-toggle-btn" title="Toggle Light / Dark Theme">
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                </button>

                {/* User Badge & Logout */}
                <div className="qa-sidebar-user">
                    <div className="qa-user-info">
                        <div className="qa-avatar">{user?.name?.charAt(0) || 'Q'}</div>
                        <div className="qa-user-details">
                            <span className="qa-user-name">{user?.name || 'QA Engineer'}</span>
                            <span className="qa-user-role font-mono">{user?.role || 'Lead QA'}</span>
                        </div>
                    </div>

                    <button onClick={logout} className="qa-logout-btn" title="Sign Out">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default QASidebar;
