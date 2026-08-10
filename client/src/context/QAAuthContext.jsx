import React, { createContext, useContext, useState, useEffect } from 'react';

const QAAuthContext = createContext(null);

export const QAAuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('qa_user');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        // Default authenticated user for immediate seamless access
        return {
            id: 'usr_qa_admin',
            name: 'QA Lead Engineer',
            email: 'admin@micromind.qa',
            role: 'Lead QA Engineer'
        };
    });

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('qa_theme') || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('qa_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }, [theme]);

    const login = (email, password) => {
        if (!email || !password) {
            throw new Error('Please enter both email and password.');
        }
        const newUser = {
            id: `usr_${Date.now()}`,
            name: email.split('@')[0] || 'QA Engineer',
            email: email,
            role: 'QA Engineer'
        };
        setUser(newUser);
        localStorage.setItem('qa_user', JSON.stringify(newUser));
        return newUser;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('qa_user');
    };

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <QAAuthContext.Provider value={{ user, login, logout, theme, setTheme, toggleTheme, isAuthenticated: Boolean(user) }}>
            {children}
        </QAAuthContext.Provider>
    );
};

export const useQAAuth = () => {
    const context = useContext(QAAuthContext);
    if (!context) {
        throw new Error('useQAAuth must be used within a QAAuthProvider');
    }
    return context;
};
