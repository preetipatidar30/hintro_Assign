import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, error, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(email, password);
        setLoading(false);
        if (success) navigate('/dashboard');
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass">
                <div className="auth-logo">
                    <h1>TaskFlow</h1>
                    <p>Sign in to your workspace</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="login-email"
                                className="input"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                                required
                                style={{ paddingLeft: 38 }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="login-password"
                                className="input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                required
                                style={{ paddingLeft: 38 }}
                            />
                        </div>
                    </div>

                    <button id="login-submit" className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                        {!loading && <FiArrowRight />}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup">Create one</Link>
                </div>

                <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Demo:</strong> alice@demo.com / password123
                </div>
            </div>
        </div>
    );
}
