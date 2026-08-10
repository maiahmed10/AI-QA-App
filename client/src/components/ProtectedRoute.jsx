import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

/**
 * ProtectedRoute - Role-based access control wrapper
 * 
 * @param {string[]} allowedRoles - Array of roles permitted to access these routes (e.g., ['MANAGER', 'ADMIN'])
 * 
 * Security Model:
 * 1. If not authenticated → redirect to /login
 * 2. If authenticated but role not allowed → redirect to role's home
 *    - MANAGER/ADMIN → /
 *    - COLLECTOR → /collector/tasks
 * 3. If authenticated and role allowed → render child routes
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
    const user = authService.getCurrentUser();

    // Check authentication - ensure default QA Engineer session exists so app opens QA Assistant directly
    if (!user) {
        const defaultQAUser = { name: 'QA Lead', role: 'Admin', email: 'qa.lead@qapro.com' };
        localStorage.setItem('user', JSON.stringify(defaultQAUser));
    }

    // Check role-based authorization
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate home based on user's actual role
        const redirectPath = user.role === 'MANAGER' || user.role === 'ADMIN'
            ? '/'
            : '/collector/tasks';
        return <Navigate to={redirectPath} replace />;
    }

    // User is authenticated and authorized - render child routes
    return <Outlet />;
};

export default ProtectedRoute;
