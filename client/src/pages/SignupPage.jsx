import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, error, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await signup(name, email, password);
        setLoading(false);
        if (success) navigate('/dashboard');
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass">
                <div className="auth-logo">
                    <h1>TaskFlow</h1>
                    <p>Create your account</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <FiUser style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="signup-name"
                                className="input"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => { setName(e.target.value); clearError(); }}
                                required
                                minLength={2}
                                style={{ paddingLeft: 38 }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="signup-email"
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
                                id="signup-password"
                                className="input"
                                type="password"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                required
                                minLength={6}
                                style={{ paddingLeft: 38 }}
                            />
                        </div>
                    </div>

                    <button id="signup-submit" className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                        {!loading && <FiArrowRight />}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
