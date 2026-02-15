import { useState } from 'react';
import { authAPI, boardAPI } from '../services/api';
import { FiX, FiSearch, FiUserPlus } from 'react-icons/fi';

export default function AddMemberModal({ boardId, currentMembers, onClose, onAdded }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(null);

    const handleSearch = async (q) => {
        setQuery(q);
        if (q.length < 2) {
            setResults([]);
            return;
        }
        try {
            setLoading(true);
            const res = await authAPI.searchUsers(q);
            // Filter out existing members
            const memberIds = currentMembers.map(m => m._id);
            setResults(res.data.filter(u => !memberIds.includes(u._id)));
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (userId) => {
        try {
            setAdding(userId);
            await boardAPI.addMember(boardId, userId);
            onAdded();
        } catch (error) {
            console.error('Failed to add member:', error);
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
                <div className="modal-header">
                    <h2>Invite Member</h2>
                    <button className="btn-icon" onClick={onClose}><FiX size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="search-box" style={{ width: '100%' }}>
                        <FiSearch className="search-icon" />
                        <input
                            className="input"
                            type="text"
                            placeholder="Search by name or email..."
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                            style={{ paddingLeft: 38 }}
                        />
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-md)' }} />
                            ))}
                        </div>
                    ) : results.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {results.map(user => (
                                <div key={user._id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <img className="avatar avatar-sm" src={user.avatar} alt={user.name} />
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleAdd(user._id)}
                                        disabled={adding === user._id}
                                    >
                                        <FiUserPlus size={13} />
                                        {adding === user._id ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 16 }}>
                            No users found
                        </p>
                    ) : (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 16 }}>
                            Type at least 2 characters to search
                        </p>
                    )}

                    {/* Current Members */}
                    <div>
                        <label className="label" style={{ marginBottom: 10 }}>Current Members ({currentMembers.length})</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {currentMembers.map(m => (
                                <div key={m._id} className="assignee-chip">
                                    <img className="avatar avatar-sm" src={m.avatar} alt={m.name} />
                                    <span>{m.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
