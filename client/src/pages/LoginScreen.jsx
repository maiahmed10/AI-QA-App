import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { Brain, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

const LoginScreen = () => {
    const [username, setUsername] = useState('student@micromind.com');
    const [password, setPassword] = useState('student123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.login(username, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFill = (email, pass) => {
        setUsername(email);
        setPassword(pass);
        setError('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-page, #0F0F0F)',
            padding: '2rem'
        }}>
            {/* Login Card */}
            <div style={{
                width: '100%',
                maxWidth: '460px',
                backgroundColor: 'var(--bg-surface, #1C1C1C)',
                borderRadius: '16px',
                border: '1px solid var(--border, #333333)',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '2.5rem 2rem 2rem 2rem',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--border, #333333)'
                }}>
                    {/* ShadowMate Logo */}
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 1.25rem auto',
                        background: 'linear-gradient(135deg, #E0AA3E 0%, #F5C451 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(224, 170, 62, 0.25)'
                    }}>
                        <Brain size={34} style={{ color: '#000000' }} />
                    </div>

                    {/* Title & Subtitle */}
                    <h1 style={{
                        margin: '0 0 0.4rem 0',
                        fontSize: '1.85rem',
                        fontWeight: '700',
                        color: 'var(--text-primary, #F2F3EC)',
                        fontFamily: 'var(--heading-font)'
                    }}>
                        ShadowMate
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#E0AA3E',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px'
                    }}>
                        Adaptive EdTech Platform
                    </p>
                </div>

                {/* Form Section */}
                <div style={{ padding: '2rem' }}>
                    <h2 style={{
                        margin: '0 0 1.25rem 0',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                    }}>
                        Welcome Back
                    </h2>

                    <form onSubmit={handleLogin}>
                        {/* Email / Username Field */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                color: 'var(--text-muted, #888888)'
                            }}>
                                Email / Username
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User
                                    size={18}
                                    color="var(--text-muted)"
                                    style={{
                                        position: 'absolute',
                                        left: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. student@micromind.com"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 44px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border, #333333)',
                                        backgroundColor: 'var(--bg-input, #0F0F0F)',
                                        color: 'var(--text-primary, #F2F3EC)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                color: 'var(--text-muted, #888888)'
                            }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock
                                    size={18}
                                    color="var(--text-muted)"
                                    style={{
                                        position: 'absolute',
                                        left: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none'
                                    }}
                                />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 44px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border, #333333)',
                                        backgroundColor: 'var(--bg-input, #0F0F0F)',
                                        color: 'var(--text-primary, #F2F3EC)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                                border: '1px solid rgba(220, 38, 38, 0.4)',
                                color: '#fca5a5',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                marginBottom: '1.25rem',
                                fontSize: '0.85rem'
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: loading ? '#ccaa44' : '#E0AA3E',
                                color: '#000000',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 150ms ease'
                            }}
                        >
                            {loading ? (
                                <span>Logging in...</span>
                            ) : (
                                <>
                                    Log In to ShadowMate
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Seeded Demo Credentials Helper Box */}
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        borderRadius: '10px',
                        background: 'rgba(224, 170, 62, 0.08)',
                        border: '1px solid rgba(224, 170, 62, 0.2)'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#E0AA3E', marginBottom: '8px' }}>
                            💡 Demo Credentials (Click to auto-fill):
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                            <button
                                type="button"
                                onClick={() => handleQuickFill('student@micromind.com', 'student123')}
                                style={{
                                    textAlign: 'left',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>🎓 <strong>Student:</strong> student@micromind.com / student123</span>
                                <span style={{ fontSize: '11px', color: '#E0AA3E' }}>Fill</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickFill('admin@micromind.com', 'admin123')}
                                style={{
                                    textAlign: 'left',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>⚙️ <strong>Admin:</strong> admin@micromind.com / admin123</span>
                                <span style={{ fontSize: '11px', color: '#E0AA3E' }}>Fill</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 2rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border)'
                }}>
                    ShadowMate Adaptive EdTech Engine v2.0.0
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
