import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import {
    Home, Users, BarChart2, Bot, FileText, HelpCircle,
    GraduationCap, Settings, LogOut, Sun, Moon, Search,
    ChevronRight, ChevronDown, BarChart3, FolderOpen, Calendar, Brain, ShieldCheck
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Section expansion state - Analytics starts expanded
    const [analyticsOpen, setAnalyticsOpen] = useState(true);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    // User data - initialized from localStorage
    const [userData] = useState(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return {
                    name: user.displayName || user.name || 'User',
                    role: user.role || 'Admin'
                };
            } catch (error) {
                console.error('Failed to load user data:', error);
            }
        }
        return {
            name: 'User',
            role: 'Admin'
        };
    });

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Keyboard shortcut for search (Cmd/Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
                document.getElementById('sidebar-search')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname.startsWith(path);
    };

    // All searchable items (flattened for search)
    const allSearchableItems = [
        { id: 'qa', label: 'AI QA Assistant', path: '/', icon: ShieldCheck, keywords: ['qa', 'test', 'cases', 'requirements', 'risks'] },
        { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), path: '/qa-assistant', icon: Home, keywords: ['home', 'dashboard'] },
        { id: 'planner', label: t('nav.planner', 'Adaptive Planner'), path: '/planner', icon: Calendar, keywords: ['planner', 'schedule', 'replan'] },
        { id: 'assignments', label: t('nav.assignments', 'Assignments'), path: '/assignments', icon: FileText, keywords: ['assignments', 'tasks', 'due'] },
        { id: 'recommendations', label: t('nav.recommendations', 'Track Recommendations'), path: '/recommendations', icon: GraduationCap, keywords: ['track', 'recommendations', 'career'] },
        { id: 'memory', label: t('nav.memory', 'Memory Profile'), path: '/memory', icon: Brain, keywords: ['memory', 'profile', 'pace'] },
        { id: 'copilots', label: t('copilots.title', 'AI Co-Pilot'), path: '/copilots', icon: Users, keywords: ['copilot', 'ai', 'tutor', 'chat'] },
        { id: 'admin-tracks', label: t('nav.adminTracks', 'Catalog Admin'), path: '/admin/tracks', icon: Settings, keywords: ['admin', 'tracks', 'catalog'] },
    ];

    // Search filtering
    const filteredItems = searchQuery.length > 0
        ? allSearchableItems.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const labelMatch = item.label.toLowerCase().includes(searchLower);
            const keywordMatch = item.keywords.some(kw => kw.includes(searchLower));
            return labelMatch || keywordMatch;
        })
        : [];

    const handleNavigation = (path) => {
        navigate(path);
        setSearchQuery('');
        setIsSearchOpen(false);
    };

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={28} style={{ color: 'var(--primary-color)' }} />
                </div>
                <div className="sidebar-branding">
                    <div className="brand-name">QA Agent Pro</div>
                    <div className="product-name">AI Testing Suite</div>
                </div>
            </div>

            {/* Command Bar Search */}
            <div className="sidebar-search-container">
                <div className="sidebar-search-wrapper">
                    <Search className="search-icon" size={16} />
                    <input
                        id="sidebar-search"
                        type="text"
                        className="sidebar-search-input"
                        placeholder="Jump to... (Ctrl+K)"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(e.target.value.length > 0);
                        }}
                        onFocus={() => searchQuery.length > 0 && setIsSearchOpen(true)}
                    />
                </div>

                {/* Search Dropdown */}
                {isSearchOpen && filteredItems.length > 0 && (
                    <div className="search-dropdown">
                        {filteredItems.map(item => (
                            <button
                                key={item.id}
                                className="search-result-item"
                                onClick={() => handleNavigation(item.path)}
                            >
                                <item.icon size={16} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {/* AI QA Assistant Primary Item */}
                <button
                    className={`nav-item ${location.pathname === '/' || location.pathname === '/qa' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/')}
                >
                    <ShieldCheck size={18} className="nav-icon" style={{ color: '#E0AA3E' }} />
                    <span className="nav-label" style={{ fontWeight: 700 }}>AI QA Assistant</span>
                </button>

                {/* SHADOWMATE STUDENT SECTION */}
                <div className="nav-section">
                    <div className="section-label">STUDENT WORKSPACE</div>

                    <button
                        className={`nav-item ${location.pathname === '/planner' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/planner')}
                    >
                        <Calendar size={18} className="nav-icon" />
                        <span className="nav-label">{t('nav.planner', 'Adaptive Planner')}</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname === '/assignments' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/assignments')}
                    >
                        <FileText size={18} className="nav-icon" />
                        <span className="nav-label">{t('nav.assignments', 'Assignments')}</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname === '/recommendations' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/recommendations')}
                    >
                        <GraduationCap size={18} className="nav-icon" />
                        <span className="nav-label">{t('nav.recommendations', 'Track Engine')}</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname === '/memory' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/memory')}
                    >
                        <Brain size={18} className="nav-icon" />
                        <span className="nav-label">{t('nav.memory', 'Memory Profile')}</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname === '/copilots' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/copilots')}
                    >
                        <Users size={18} className="nav-icon" />
                        <span className="nav-label">{t('nav.copilots', 'Study Co-Pilot')}</span>
                    </button>
                </div>

                {/* ADMIN SECTION */}
                <div className="nav-section">
                    <div className="section-label">ADMINISTRATION</div>

                    <button
                        className={`nav-item ${location.pathname === '/admin/tracks' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/admin/tracks')}
                    >
                        <Settings size={18} className="nav-icon" />
                        <span className="nav-label">{t('nav.adminTracks', 'Catalog Admin')}</span>
                    </button>
                </div>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="footer-links" style={{ padding: '8px 12px', borderBottom: 'none' }}>
                    <LanguageSwitcher />
                </div>
                {/* System Links */}
                <div className="footer-links">
                    <button className="footer-link" onClick={() => handleNavigation('/docs')}>
                        <HelpCircle size={16} />
                        <span>{t('nav.documentation', 'Documentation')}</span>
                    </button>
                    <button className="footer-link" onClick={() => handleNavigation('/campus')}>
                        <GraduationCap size={16} />
                        <span>{t('nav.campus', 'Campus')}</span>
                    </button>
                </div>

                {/* User Plate */}
                <div className="user-plate">
                    <div className="user-info">
                        <div className="user-avatar">
                            {userData.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{userData.name}</div>
                            <div className="user-role">{userData.role}</div>
                        </div>
                    </div>

                    {/* Control Cluster */}
                    <div className="control-cluster">
                        <button
                            className="control-btn"
                            onClick={toggleTheme}
                            title="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button
                            className="control-btn"
                            onClick={() => navigate('/settings')}
                            title="Settings"
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            className="control-btn"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
