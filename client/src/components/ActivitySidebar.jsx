import { useState, useEffect } from 'react';
import { activityAPI } from '../services/api';
import { FiX, FiClock } from 'react-icons/fi';

const actionLabels = {
    created_board: 'created board',
    updated_board: 'updated board',
    deleted_board: 'deleted board',
    created_list: 'created list',
    updated_list: 'updated list',
    deleted_list: 'deleted list',
    created_task: 'created task',
    updated_task: 'updated task',
    deleted_task: 'deleted task',
    moved_task: 'moved task',
    assigned_user: 'assigned user to',
    unassigned_user: 'unassigned user from',
    added_member: 'added member',
    removed_member: 'removed member'
};

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivitySidebar({ boardId, onClose }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchActivity = async (p = 1) => {
        try {
            setLoading(true);
            const res = await activityAPI.getByBoard(boardId, { page: p, limit: 15 });
            if (p === 1) {
                setActivities(res.data.activities);
            } else {
                setActivities(prev => [...prev, ...res.data.activities]);
            }
            setTotalPages(res.data.pagination.pages);
            setPage(p);
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity(1);
    }, [boardId]);

    return (
        <div className="activity-sidebar">
            <div className="activity-sidebar-header">
                <h3><FiClock style={{ verticalAlign: 'middle', marginRight: 6 }} /> Activity</h3>
                <button className="btn-icon" onClick={onClose}><FiX size={18} /></button>
            </div>

            <div className="activity-list">
                {loading && activities.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0' }}>
                            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6 }} />
                                <div className="skeleton" style={{ height: 10, width: '40%' }} />
                            </div>
                        </div>
                    ))
                ) : activities.length === 0 ? (
                    <div className="empty-state" style={{ padding: 30 }}>
                        <p>No activity yet</p>
                    </div>
                ) : (
                    <>
                        {activities.map((activity) => (
                            <div key={activity._id} className="activity-item">
                                <img className="avatar avatar-sm" src={activity.user?.avatar} alt={activity.user?.name} />
                                <div className="activity-content">
                                    <p>
                                        <span className="activity-user">{activity.user?.name}</span>{' '}
                                        <span className="activity-action">{actionLabels[activity.action] || activity.action}</span>{' '}
                                        <span className="activity-entity">{activity.entityTitle}</span>
                                    </p>
                                    {activity.details && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activity.details}</p>
                                    )}
                                    <span className="activity-time">{timeAgo(activity.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                        {page < totalPages && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => fetchActivity(page + 1)}
                                disabled={loading}
                                style={{ width: '100%', marginTop: 8 }}
                            >
                                {loading ? 'Loading...' : 'Load more'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
