const List = require('../models/List');
const Task = require('../models/Task');
const Board = require('../models/Board');
const Activity = require('../models/Activity');

// POST /api/boards/:boardId/lists
exports.createList = async (req, res) => {
    try {
        const { title } = req.body;
        const { boardId } = req.params;

        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const isMember = board.members.some(m => m.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get next position
        const maxPosition = await List.findOne({ board: boardId })
            .sort({ position: -1 })
            .select('position');
        const position = maxPosition ? maxPosition.position + 1 : 0;

        const list = await List.create({ title, board: boardId, position });

        await Activity.create({
            user: req.user._id,
            board: boardId,
            action: 'created_list',
            entityType: 'list',
            entityTitle: title
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${boardId}`).emit('list:created', list);

        res.status(201).json(list);
    } catch (error) {
        console.error('Create list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/lists/:id
exports.updateList = async (req, res) => {
    try {
        const { title } = req.body;
        const list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        list.title = title || list.title;
        await list.save();

        await Activity.create({
            user: req.user._id,
            board: list.board,
            action: 'updated_list',
            entityType: 'list',
            entityTitle: list.title
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${list.board}`).emit('list:updated', list);

        res.json(list);
    } catch (error) {
        console.error('Update list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/lists/:id
exports.deleteList = async (req, res) => {
    try {
        const list = await List.findById(req.params.id);
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Delete all tasks in the list
        await Task.deleteMany({ list: list._id });

        const boardId = list.board;
        await List.findByIdAndDelete(list._id);

        await Activity.create({
            user: req.user._id,
            board: boardId,
            action: 'deleted_list',
            entityType: 'list',
            entityTitle: list.title
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${boardId}`).emit('list:deleted', { listId: list._id, boardId });

        res.json({ message: 'List deleted successfully' });
    } catch (error) {
        console.error('Delete list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/lists/reorder
exports.reorderLists = async (req, res) => {
    try {
        const { lists } = req.body; // [{ _id, position }]

        const bulkOps = lists.map(item => ({
            updateOne: {
                filter: { _id: item._id },
                update: { position: item.position }
            }
        }));

        await List.bulkWrite(bulkOps);

        const io = req.app.get('io');
        if (io && lists.length > 0) {
            const list = await List.findById(lists[0]._id);
            if (list) {
                io.to(`board:${list.board}`).emit('lists:reordered', lists);
            }
        }

        res.json({ message: 'Lists reordered' });
    } catch (error) {
        console.error('Reorder lists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
