import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { FiLogOut, FiLayout } from 'react-icons/fi';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { connected } = useSocket();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/dashboard" className="navbar-brand">
                <FiLayout />
                TaskFlow
            </Link>

            <div className="navbar-actions">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: connected ? 'var(--success)' : 'var(--text-muted)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }} />
                    {connected ? 'Live' : 'Offline'}
                </div>

                {user && (
                    <div className="navbar-user">
                        <img className="avatar" src={user.avatar} alt={user.name} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.name}</span>
                    </div>
                )}

                <button className="btn-icon" onClick={handleLogout} title="Logout">
                    <FiLogOut size={18} />
                </button>
            </div>
        </nav>
    );
}
