const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// GET /api/boards — list all boards the user is a member of
exports.getBoards = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const query = {
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        };

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const [boards, total] = await Promise.all([
            Board.find(query)
                .populate('owner', 'name email avatar')
                .populate('members', 'name email avatar')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            Board.countDocuments(query)
        ]);

        res.json({
            boards,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get boards error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/boards
exports.createBoard = async (req, res) => {
    try {
        const { title, description, background } = req.body;

        const board = await Board.create({
            title,
            description,
            background: background || '#6366f1',
            owner: req.user._id,
            members: [req.user._id]
        });

        await board.populate('owner', 'name email avatar');
        await board.populate('members', 'name email avatar');

        // Log activity
        await Activity.create({
            user: req.user._id,
            board: board._id,
            action: 'created_board',
            entityType: 'board',
            entityTitle: board.title
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) io.emit('board:created', board);

        res.status(201).json(board);
    } catch (error) {
        console.error('Create board error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/boards/:id — get full board with lists and tasks
exports.getBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar');

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check membership
        const isMember = board.members.some(m => m._id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const lists = await List.find({ board: board._id }).sort({ position: 1 });
        const tasks = await Task.find({ board: board._id })
            .populate('assignees', 'name email avatar')
            .sort({ position: 1 });

        res.json({ board, lists, tasks });
    } catch (error) {
        console.error('Get board error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/boards/:id
exports.updateBoard = async (req, res) => {
    try {
        const { title, description, background } = req.body;

        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only board owner can update' });
        }

        if (title) board.title = title;
        if (description !== undefined) board.description = description;
        if (background) board.background = background;

        await board.save();
        await board.populate('owner', 'name email avatar');
        await board.populate('members', 'name email avatar');

        await Activity.create({
            user: req.user._id,
            board: board._id,
            action: 'updated_board',
            entityType: 'board',
            entityTitle: board.title
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${board._id}`).emit('board:updated', board);

        res.json(board);
    } catch (error) {
        console.error('Update board error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/boards/:id
exports.deleteBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only board owner can delete' });
        }

        // Cascade delete
        await Task.deleteMany({ board: board._id });
        await List.deleteMany({ board: board._id });
        await Activity.deleteMany({ board: board._id });
        await Board.findByIdAndDelete(board._id);

        const io = req.app.get('io');
        if (io) io.to(`board:${board._id}`).emit('board:deleted', { boardId: board._id });

        res.json({ message: 'Board deleted successfully' });
    } catch (error) {
        console.error('Delete board error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/boards/:id/members — add member
exports.addMember = async (req, res) => {
    try {
        const { userId } = req.body;
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const isMember = board.members.some(m => m.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (board.members.some(m => m.toString() === userId)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        board.members.push(userId);
        await board.save();
        await board.populate('members', 'name email avatar');
        await board.populate('owner', 'name email avatar');

        const User = require('../models/User');
        const addedUser = await User.findById(userId).select('name email avatar');

        await Activity.create({
            user: req.user._id,
            board: board._id,
            action: 'added_member',
            entityType: 'user',
            entityTitle: addedUser?.name || 'Unknown',
            details: `${req.user.name} added ${addedUser?.name} to the board`
        });

        const io = req.app.get('io');
        if (io) io.to(`board:${board._id}`).emit('member:added', { board, member: addedUser });

        res.json(board);
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/boards/:id/members/:userId — remove member
exports.removeMember = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only board owner can remove members' });
        }

        if (req.params.userId === board.owner.toString()) {
            return res.status(400).json({ message: 'Cannot remove the board owner' });
        }

        board.members = board.members.filter(m => m.toString() !== req.params.userId);
        await board.save();
        await board.populate('members', 'name email avatar');
        await board.populate('owner', 'name email avatar');

        const io = req.app.get('io');
        if (io) io.to(`board:${board._id}`).emit('member:removed', { board, userId: req.params.userId });

        res.json(board);
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
