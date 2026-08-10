import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQAAuth } from '../context/QAAuthContext';

const QAProtectedRoute = () => {
    const { isAuthenticated } = useQAAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default QAProtectedRoute;
