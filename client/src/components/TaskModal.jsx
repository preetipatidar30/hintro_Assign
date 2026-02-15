import { useState } from 'react';
import { taskAPI } from '../services/api';
import { FiX, FiTrash2, FiCalendar, FiUser, FiAlignLeft, FiTag } from 'react-icons/fi';

export default function TaskModal({ task, boardMembers, onClose, onChange }) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority || 'medium');
    const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        try {
            setSaving(true);
            await taskAPI.update(task._id, { title, description, priority, dueDate: dueDate || null });
            onChange();
        } catch (error) {
            console.error('Failed to update task:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this task?')) return;
        try {
            setDeleting(true);
            await taskAPI.delete(task._id);
            onChange();
        } catch (error) {
            console.error('Failed to delete task:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleAssign = async (userId) => {
        const isAssigned = task.assignees?.some(a => a._id === userId);
        try {
            await taskAPI.assign(task._id, userId, isAssigned ? 'unassign' : 'assign');
            onChange();
        } catch (error) {
            console.error('Failed to assign task:', error);
        }
    };

    const priorities = ['low', 'medium', 'high', 'urgent'];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Task Details</h2>
                    <button className="btn-icon" onClick={onClose}><FiX size={18} /></button>
                </div>

                <div className="modal-body">
                    {/* Title */}
                    <div className="task-detail-section">
                        <div className="task-detail-row">
                            <FiTag className="detail-icon" size={16} />
                            <div style={{ flex: 1 }}>
                                <label className="label">Title</label>
                                <input
                                    className="input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Task title"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="task-detail-section">
                        <div className="task-detail-row">
                            <FiAlignLeft className="detail-icon" size={16} />
                            <div style={{ flex: 1 }}>
                                <label className="label">Description</label>
                                <textarea
                                    className="input"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add a more detailed description..."
                                    rows={4}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="task-detail-section">
                        <h4>Priority</h4>
                        <div className="priority-select">
                            {priorities.map(p => (
                                <button
                                    key={p}
                                    className={`priority-option ${priority === p ? 'active' : ''}`}
                                    data-priority={p}
                                    onClick={() => setPriority(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="task-detail-section">
                        <div className="task-detail-row">
                            <FiCalendar className="detail-icon" size={16} />
                            <div style={{ flex: 1 }}>
                                <label className="label">Due Date</label>
                                <input
                                    className="input"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Assignees */}
                    <div className="task-detail-section">
                        <div className="task-detail-row">
                            <FiUser className="detail-icon" size={16} />
                            <div style={{ flex: 1 }}>
                                <label className="label">Assignees</label>
                                <div className="task-assignees-list">
                                    {boardMembers.map(member => {
                                        const isAssigned = task.assignees?.some(a => a._id === member._id);
                                        return (
                                            <button
                                                key={member._id}
                                                className="assignee-chip"
                                                onClick={() => handleAssign(member._id)}
                                                style={{
                                                    borderColor: isAssigned ? 'var(--accent)' : 'var(--border)',
                                                    background: isAssigned ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)'
                                                }}
                                            >
                                                <img className="avatar avatar-sm" src={member.avatar} alt={member.name} />
                                                <span>{member.name}</span>
                                                {isAssigned && <span style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Labels display */}
                    {task.labels?.length > 0 && (
                        <div className="task-detail-section">
                            <h4>Labels</h4>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {task.labels.map((label, i) => (
                                    <span key={i} className="task-label" style={{ background: `${label.color}20`, color: label.color, padding: '4px 12px', fontSize: '0.75rem' }}>
                                        {label.text}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                    <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                        <FiTrash2 size={14} />
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
