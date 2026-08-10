import React from 'react';
import { Outlet } from 'react-router-dom';
import QASidebar from './QASidebar';

/**
 * QALayout - Professional Multi-Page Web App Shell with Persistent Sidebar Navigation.
 */
const QALayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page, #0F0F0F)' }}>
            {/* Persistent Navigation Sidebar */}
            <QASidebar />

            {/* Main Workspace Content Area */}
            <main style={{
                flexGrow: 1,
                padding: '1.75rem 2rem',
                overflowY: 'auto',
                minWidth: 0,
                boxSizing: 'border-box'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default QALayout;
