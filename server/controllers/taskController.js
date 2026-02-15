const Task = require('../models/Task');
const List = require('../models/List');
const Board = require('../models/Board');
const Activity = require('../models/Activity');

// POST /api/lists/:listId/tasks
exports.createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, labels } = req.body;
        const { listId } = req.params;

        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Get next position
        const maxPosition = await Task.findOne({ list: listId })
            .sort({ position: -1 })
            .select('position');
        const position = maxPosition ? maxPosition.position + 1 : 0;

        const task = await Task.create({
            title,
            description,
            list: listId,
            board: list.board,
            position,
            priority: priority || 'medium',
            dueDate,
            labels: labels || []
        });

        await task.populate('assignees', 'name email avatar');

        await Activity.create({
            user: req.user._id,
            board: list.board,
            action: 'created_task',
            entityType: 'task',
            entityTitle: title
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${list.board}`).emit('task:created', task);

        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, labels } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (labels !== undefined) task.labels = labels;

        await task.save();
        await task.populate('assignees', 'name email avatar');

        await Activity.create({
            user: req.user._id,
            board: task.board,
            action: 'updated_task',
            entityType: 'task',
            entityTitle: task.title
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${task.board}`).emit('task:updated', task);

        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const boardId = task.board;
        const taskTitle = task.title;
        await Task.findByIdAndDelete(task._id);

        await Activity.create({
            user: req.user._id,
            board: boardId,
            action: 'deleted_task',
            entityType: 'task',
            entityTitle: taskTitle
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${boardId}`).emit('task:deleted', { taskId: task._id, listId: task.list, boardId });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/tasks/reorder — move task across lists or reorder within list
exports.reorderTasks = async (req, res) => {
    try {
        const { taskId, sourceListId, destinationListId, newPosition } = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const oldListId = task.list.toString();
        const movedAcrossLists = sourceListId !== destinationListId;

        // Update task's list and position
        task.list = destinationListId;
        task.position = newPosition;
        await task.save();

        // Reorder tasks in destination list
        const destTasks = await Task.find({
            list: destinationListId,
            _id: { $ne: taskId }
        }).sort({ position: 1 });

        // Insert at new position and recalculate
        const updatedTasks = [];
        let pos = 0;
        let inserted = false;

        for (const t of destTasks) {
            if (pos === newPosition && !inserted) {
                pos++; // skip position for the moved task
                inserted = true;
            }
            t.position = pos;
            await t.save();
            updatedTasks.push(t);
            pos++;
        }

        // If moving across lists, reorder source list
        if (movedAcrossLists) {
            const sourceTasks = await Task.find({ list: sourceListId }).sort({ position: 1 });
            for (let i = 0; i < sourceTasks.length; i++) {
                sourceTasks[i].position = i;
                await sourceTasks[i].save();
            }

            await Activity.create({
                user: req.user._id,
                board: task.board,
                action: 'moved_task',
                entityType: 'task',
                entityTitle: task.title,
                details: `Moved task to a different list`
            });
        }

        await task.populate('assignees', 'name email avatar');

        const io = req.app.get('io');
        if (io) {
            io.to(`board:${task.board}`).emit('task:moved', {
                task,
                sourceListId,
                destinationListId,
                newPosition
            });
        }

        res.json({ message: 'Task reordered', task });
    } catch (error) {
        console.error('Reorder tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/tasks/:id/assign
exports.assignTask = async (req, res) => {
    try {
        const { userId, action } = req.body; // action: 'assign' or 'unassign'
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (action === 'assign') {
            if (!task.assignees.some(a => a.toString() === userId)) {
                task.assignees.push(userId);
            }
        } else if (action === 'unassign') {
            task.assignees = task.assignees.filter(a => a.toString() !== userId);
        }

        await task.save();
        await task.populate('assignees', 'name email avatar');

        const User = require('../models/User');
        const assignedUser = await User.findById(userId).select('name');

        await Activity.create({
            user: req.user._id,
            board: task.board,
            action: action === 'assign' ? 'assigned_user' : 'unassigned_user',
            entityType: 'task',
            entityTitle: task.title,
            details: `${action === 'assign' ? 'Assigned' : 'Unassigned'} ${assignedUser?.name || 'user'}`
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${task.board}`).emit('task:updated', task);

        res.json(task);
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/boards/:boardId/tasks/search?q=
exports.searchTasks = async (req, res) => {
    try {
        const { q } = req.query;
        const { boardId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (!q) {
            return res.json({ tasks: [], pagination: { page, limit, total: 0, pages: 0 } });
        }

        const query = {
            board: boardId,
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        };

        const [tasks, total] = await Promise.all([
            Task.find(query)
                .populate('assignees', 'name email avatar')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Task.countDocuments(query)
        ]);

        res.json({
            tasks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Search tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
