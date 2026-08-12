import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import QASidebar from './QASidebar';

/**
 * QALayout - Professional AI SaaS Layout Shell with Fixed Sidebar & Responsive Main Area.
 */
const QALayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return localStorage.getItem('qa_sidebar_collapsed') === 'true';
    });

    useEffect(() => {
        const handleSidebarToggle = (e) => {
            if (e.detail && typeof e.detail.collapsed === 'boolean') {
                setIsSidebarCollapsed(e.detail.collapsed);
            }
        };

        window.addEventListener('qa_sidebar_toggle', handleSidebarToggle);
        return () => window.removeEventListener('qa_sidebar_toggle', handleSidebarToggle);
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page, #0B0F19)' }}>
            {/* Fixed Collapsible Navigation Sidebar */}
            <QASidebar />

            {/* Main Workspace Content Area */}
            <main
                style={{
                    flexGrow: 1,
                    marginLeft: isSidebarCollapsed ? '76px' : '260px',
                    padding: '2rem 2.5rem',
                    overflowY: 'auto',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <Outlet />
            </main>
        </div>
    );
};

export default QALayout;
