import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQAAuth } from '../context/QAAuthContext';
import { Cpu, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import './QALoginPage.css';

const QALoginPage = () => {
    const [email, setEmail] = useState('admin@micromind.qa');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useQAAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError('Please enter your email address or username.');
            return;
        }

        if (!password.trim()) {
            setError('Please enter your password.');
            return;
        }

        if (password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }

        setIsLoading(true);

        setTimeout(() => {
            try {
                login(email, password);
                setIsLoading(false);
                navigate('/dashboard');
            } catch (err) {
                setError(err.message || 'Login failed.');
                setIsLoading(false);
            }
        }, 400);
    };

    return (
        <div className="qa-login-container">
            <div className="qa-login-card">
                {/* Brand Header */}
                <div className="qa-login-brand">
                    <div className="qa-brand-logo">
                        <Cpu size={32} />
                    </div>
                    <div>
                        <span className="qa-brand-tag font-mono">ENTERPRISE QA PLATFORM</span>
                        <h1 className="qa-brand-title">MicroMind QA Suite</h1>
                    </div>
                </div>

                <p className="qa-login-subtitle">
                    Sign in to access AI QA Testing, Test Case Management & Live API Execution
                </p>

                {/* Error Banner */}
                {error && (
                    <div className="qa-login-error">
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="qa-login-form">
                    <div className="qa-input-group">
                        <label className="qa-input-label">Email or Username</label>
                        <div className="qa-input-wrapper">
                            <Mail size={18} className="qa-field-icon" />
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="qa-form-input"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="qa-input-group">
                        <label className="qa-input-label">Password</label>
                        <div className="qa-input-wrapper">
                            <Lock size={18} className="qa-field-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="qa-form-input"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button type="submit" className="qa-login-btn" disabled={isLoading}>
                        {isLoading ? (
                            <span>Authenticating...</span>
                        ) : (
                            <>
                                <span>Sign In to Dashboard</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Quick Preset Access Info */}
                <div className="qa-login-footer">
                    <div className="qa-preset-info">
                        <CheckCircle2 size={15} className="text-gold" />
                        <span>Demo Account: admin@micromind.qa (password pre-filled)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QALoginPage;
