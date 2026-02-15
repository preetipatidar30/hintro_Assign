const Activity = require('../models/Activity');

// GET /api/boards/:boardId/activity
exports.getActivity = async (req, res) => {
    try {
        const { boardId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [activities, total] = await Promise.all([
            Activity.find({ board: boardId })
                .populate('user', 'name email avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Activity.countDocuments({ board: boardId })
        ]);

        res.json({
            activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
