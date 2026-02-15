import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { boardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiSearch, FiLayout, FiUsers, FiX } from 'react-icons/fi';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBoard, setNewBoard] = useState({ title: '', description: '', background: '#6366f1' });
    const [creating, setCreating] = useState(false);

    const bgColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#3b82f6'];

    const fetchBoards = async (page = 1) => {
        try {
            setLoading(true);
            const res = await boardAPI.getAll({ page, limit: 12, search });
            setBoards(res.data.boards);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error('Failed to fetch boards:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoards(1);
    }, [search]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newBoard.title.trim()) return;
        try {
            setCreating(true);
            await boardAPI.create(newBoard);
            setShowCreateModal(false);
            setNewBoard({ title: '', description: '', background: '#6366f1' });
            fetchBoards(1);
        } catch (error) {
            console.error('Failed to create board:', error);
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <>
            <Navbar />
            <main className="dashboard">
                <div className="dashboard-header">
                    <h1>
                        My Boards <span>({pagination.total})</span>
                    </h1>
                    <div className="dashboard-controls">
                        <div className="search-box">
                            <FiSearch className="search-icon" />
                            <input
                                id="search-boards"
                                className="input"
                                type="text"
                                placeholder="Search boards..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button id="create-board-btn" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                            <FiPlus /> New Board
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="boards-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
                        ))}
                    </div>
                ) : boards.length === 0 ? (
                    <div className="empty-state">
                        <FiLayout />
                        <h3>No boards yet</h3>
                        <p>Create your first board to start organizing tasks with your team.</p>
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
                            <FiPlus /> Create Board
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="boards-grid">
                            {boards.map((board, idx) => (
                                <div
                                    key={board._id}
                                    className="board-card"
                                    style={{ '--card-accent': board.background, animationDelay: `${idx * 0.05}s` }}
                                    onClick={() => navigate(`/board/${board._id}`)}
                                >
                                    <h3>{board.title}</h3>
                                    <p>{board.description || 'No description'}</p>
                                    <div className="board-card-footer">
                                        <div className="board-card-members">
                                            {board.members?.slice(0, 4).map((m) => (
                                                <img key={m._id} className="avatar avatar-sm" src={m.avatar} alt={m.name} title={m.name} />
                                            ))}
                                            {board.members?.length > 4 && (
                                                <span className="avatar avatar-sm" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                                                    +{board.members.length - 4}
                                                </span>
                                            )}
                                        </div>
                                        <span className="board-card-date">{formatDate(board.updatedAt)}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="create-board-card" onClick={() => setShowCreateModal(true)}>
                                <FiPlus size={24} />
                                <span>Create New Board</span>
                            </div>
                        </div>

                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button disabled={pagination.page === 1} onClick={() => fetchBoards(pagination.page - 1)}>Previous</button>
                                {[...Array(pagination.pages)].map((_, i) => (
                                    <button key={i} className={pagination.page === i + 1 ? 'active' : ''} onClick={() => fetchBoards(i + 1)}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button disabled={pagination.page === pagination.pages} onClick={() => fetchBoards(pagination.page + 1)}>Next</button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Create Board Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Board</h2>
                            <button className="btn-icon" onClick={() => setShowCreateModal(false)}><FiX size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div>
                                    <label className="label">Board Title</label>
                                    <input
                                        id="new-board-title"
                                        className="input"
                                        type="text"
                                        placeholder="e.g. Product Launch Q1"
                                        value={newBoard.title}
                                        onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="label">Description (optional)</label>
                                    <textarea
                                        id="new-board-desc"
                                        className="input"
                                        placeholder="What's this board about?"
                                        value={newBoard.description}
                                        onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                <div>
                                    <label className="label">Color</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {bgColors.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setNewBoard({ ...newBoard, background: c })}
                                                style={{
                                                    width: 32, height: 32, borderRadius: '50%', background: c, border: newBoard.background === c ? '3px solid white' : '3px solid transparent',
                                                    cursor: 'pointer', transition: 'transform 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.15)'}
                                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button id="submit-create-board" type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Board'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
