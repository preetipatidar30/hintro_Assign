import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import ActivitySidebar from '../components/ActivitySidebar';
import AddMemberModal from '../components/AddMemberModal';
import { boardAPI, listAPI, taskAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiX, FiMoreHorizontal, FiEdit2, FiTrash2, FiSearch, FiActivity, FiUserPlus, FiArrowLeft } from 'react-icons/fi';

export default function BoardPage() {
    const { id: boardId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, joinBoard, leaveBoard } = useSocket();

    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showActivity, setShowActivity] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [addingList, setAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [editingListId, setEditingListId] = useState(null);
    const [editListTitle, setEditListTitle] = useState('');
    const [addingTaskInList, setAddingTaskInList] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);

    // Fetch board data
    const fetchBoard = useCallback(async () => {
        try {
            const res = await boardAPI.getById(boardId);
            setBoard(res.data.board);
            setLists(res.data.lists);
            setTasks(res.data.tasks);
        } catch (error) {
            console.error('Failed to fetch board:', error);
            if (error.response?.status === 404 || error.response?.status === 403) {
                navigate('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    }, [boardId, navigate]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    // Socket.IO real-time updates
    useEffect(() => {
        if (!socket || !boardId) return;
        joinBoard(boardId);

        const handlers = {
            'list:created': (list) => setLists(prev => [...prev, list]),
            'list:updated': (list) => setLists(prev => prev.map(l => l._id === list._id ? list : l)),
            'list:deleted': ({ listId }) => {
                setLists(prev => prev.filter(l => l._id !== listId));
                setTasks(prev => prev.filter(t => t.list !== listId));
            },
            'task:created': (task) => setTasks(prev => [...prev, task]),
            'task:updated': (task) => setTasks(prev => prev.map(t => t._id === task._id ? task : t)),
            'task:deleted': ({ taskId }) => setTasks(prev => prev.filter(t => t._id !== taskId)),
            'task:moved': () => fetchBoard(),
            'member:added': ({ board: b }) => setBoard(b),
            'member:removed': ({ board: b }) => setBoard(b),
            'board:updated': (b) => setBoard(b),
        };

        Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

        return () => {
            leaveBoard(boardId);
            Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
        };
    }, [socket, boardId]);

    // Get tasks for a specific list
    const getListTasks = (listId) => {
        const source = searchResults || tasks;
        return source.filter(t => t.list === listId || t.list?._id === listId).sort((a, b) => a.position - b.position);
    };

    // Drag and Drop handler
    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceListId = source.droppableId;
        const destListId = destination.droppableId;

        // Optimistic update
        const taskToMove = tasks.find(t => t._id === draggableId);
        if (!taskToMove) return;

        const updatedTasks = tasks.map(t => {
            if (t._id === draggableId) {
                return { ...t, list: destListId, position: destination.index };
            }
            return t;
        });
        setTasks(updatedTasks);

        try {
            await taskAPI.reorder({
                taskId: draggableId,
                sourceListId,
                destinationListId: destListId,
                newPosition: destination.index
            });
        } catch (error) {
            console.error('Reorder failed:', error);
            fetchBoard(); // Revert on error
        }
    };

    // Add list
    const handleAddList = async (e) => {
        e?.preventDefault();
        if (!newListTitle.trim()) return;
        try {
            await listAPI.create(boardId, { title: newListTitle });
            setNewListTitle('');
            setAddingList(false);
            fetchBoard();
        } catch (error) {
            console.error('Failed to create list:', error);
        }
    };

    // Update list
    const handleUpdateList = async (listId) => {
        if (!editListTitle.trim()) return;
        try {
            await listAPI.update(listId, { title: editListTitle });
            setEditingListId(null);
            fetchBoard();
        } catch (error) {
            console.error('Failed to update list:', error);
        }
    };

    // Delete list
    const handleDeleteList = async (listId) => {
        if (!window.confirm('Delete this list and all its tasks?')) return;
        try {
            await listAPI.delete(listId);
            fetchBoard();
        } catch (error) {
            console.error('Failed to delete list:', error);
        }
    };

    // Add task
    const handleAddTask = async (listId) => {
        if (!newTaskTitle.trim()) return;
        try {
            await taskAPI.create(listId, { title: newTaskTitle });
            setNewTaskTitle('');
            setAddingTaskInList(null);
            fetchBoard();
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    // Search tasks
    const handleSearch = async (q) => {
        setSearchQuery(q);
        if (!q.trim()) {
            setSearchResults(null);
            return;
        }
        try {
            const res = await taskAPI.search(boardId, { q });
            setSearchResults(res.data.tasks);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    // Task updated/deleted callback
    const handleTaskChange = () => {
        setSelectedTask(null);
        fetchBoard();
    };

    // Member added callback
    const handleMemberAdded = () => {
        setShowAddMember(false);
        fetchBoard();
    };

    const getPriorityColor = (p) => {
        const colors = { low: 'var(--priority-low)', medium: 'var(--priority-medium)', high: 'var(--priority-high)', urgent: 'var(--priority-urgent)' };
        return colors[p] || colors.medium;
    };

    const formatDue = (d) => {
        if (!d) return null;
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div style={{ padding: 24, display: 'flex', gap: 16 }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ width: 300, height: 400, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="board-page">
                {/* Toolbar */}
                <div className="board-toolbar">
                    <div className="board-toolbar-left">
                        <button className="btn-icon" onClick={() => navigate('/dashboard')} title="Back">
                            <FiArrowLeft size={18} />
                        </button>
                        <h1>{board?.title}</h1>
                    </div>
                    <div className="board-toolbar-right">
                        <div className="search-box">
                            <FiSearch className="search-icon" />
                            <input
                                className="input"
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ width: 200, paddingLeft: 34, fontSize: '0.8rem', padding: '7px 12px 7px 34px' }}
                            />
                        </div>
                        <div className="board-members-bar">
                            {board?.members?.slice(0, 5).map(m => (
                                <img key={m._id} className="avatar avatar-sm" src={m.avatar} alt={m.name} title={m.name} />
                            ))}
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
                            <FiUserPlus size={14} /> Invite
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowActivity(!showActivity)}>
                            <FiActivity size={14} /> Activity
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="kanban-container">
                        {lists.map((list) => {
                            const listTasks = getListTasks(list._id);
                            return (
                                <div key={list._id} className="kanban-list">
                                    {/* List Header */}
                                    <div className="kanban-list-header">
                                        {editingListId === list._id ? (
                                            <form onSubmit={(e) => { e.preventDefault(); handleUpdateList(list._id); }} style={{ display: 'flex', gap: 6, flex: 1 }}>
                                                <input
                                                    className="input"
                                                    value={editListTitle}
                                                    onChange={(e) => setEditListTitle(e.target.value)}
                                                    autoFocus
                                                    onBlur={() => handleUpdateList(list._id)}
                                                    style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                                />
                                            </form>
                                        ) : (
                                            <h3>
                                                {list.title}
                                                <span className="task-count">{listTasks.length}</span>
                                            </h3>
                                        )}
                                        <div className="list-actions">
                                            <button className="btn-icon" onClick={() => { setEditingListId(list._id); setEditListTitle(list.title); }} title="Edit list">
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button className="btn-icon" onClick={() => handleDeleteList(list._id)} title="Delete list">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Droppable Task Area */}
                                    <Droppable droppableId={list._id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="kanban-list-body"
                                                style={{ background: snapshot.isDraggingOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}
                                            >
                                                {listTasks.map((task, index) => (
                                                    <Draggable key={task._id} draggableId={task._id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                                                onClick={() => setSelectedTask(task)}
                                                            >
                                                                {task.labels?.length > 0 && (
                                                                    <div className="task-card-labels">
                                                                        {task.labels.map((label, i) => (
                                                                            <span key={i} className="task-label" style={{ background: `${label.color}20`, color: label.color }}>
                                                                                {label.text}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div className="task-card-title">{task.title}</div>
                                                                <div className="task-card-meta">
                                                                    <div className="task-card-info">
                                                                        <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                                                                            ● {task.priority}
                                                                        </span>
                                                                        {task.dueDate && (
                                                                            <span className="task-due">📅 {formatDue(task.dueDate)}</span>
                                                                        )}
                                                                    </div>
                                                                    {task.assignees?.length > 0 && (
                                                                        <div className="task-card-assignees">
                                                                            {task.assignees.slice(0, 3).map(a => (
                                                                                <img key={a._id} className="avatar" src={a.avatar} alt={a.name} title={a.name} />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>

                                    {/* Add Task */}
                                    <div className="kanban-list-footer">
                                        {addingTaskInList === list._id ? (
                                            <div>
                                                <input
                                                    className="input"
                                                    placeholder="Task title..."
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(list._id); if (e.key === 'Escape') setAddingTaskInList(null); }}
                                                    autoFocus
                                                    style={{ marginBottom: 6, fontSize: '0.85rem' }}
                                                />
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleAddTask(list._id)}>Add</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => { setAddingTaskInList(null); setNewTaskTitle(''); }}>
                                                        <FiX size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="add-task-btn" onClick={() => { setAddingTaskInList(list._id); setNewTaskTitle(''); }}>
                                                <FiPlus size={14} /> Add task
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add List */}
                        {addingList ? (
                            <div className="add-list-form">
                                <input
                                    className="input"
                                    placeholder="List title..."
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') setAddingList(false); }}
                                    autoFocus
                                />
                                <div className="add-list-form-actions">
                                    <button className="btn btn-primary btn-sm" onClick={handleAddList}>Add List</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setAddingList(false); setNewListTitle(''); }}>
                                        <FiX size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="add-list-card" onClick={() => setAddingList(true)}>
                                <FiPlus size={16} /> Add List
                            </div>
                        )}
                    </div>
                </DragDropContext>
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    boardMembers={board?.members || []}
                    onClose={() => setSelectedTask(null)}
                    onChange={handleTaskChange}
                />
            )}

            {/* Activity Sidebar */}
            {showActivity && (
                <ActivitySidebar boardId={boardId} onClose={() => setShowActivity(false)} />
            )}

            {/* Add Member Modal */}
            {showAddMember && (
                <AddMemberModal
                    boardId={boardId}
                    currentMembers={board?.members || []}
                    onClose={() => setShowAddMember(false)}
                    onAdded={handleMemberAdded}
                />
            )}
        </>
    );
}
