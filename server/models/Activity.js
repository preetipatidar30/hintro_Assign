const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'created_board', 'updated_board', 'deleted_board',
            'created_list', 'updated_list', 'deleted_list',
            'created_task', 'updated_task', 'deleted_task', 'moved_task',
            'assigned_user', 'unassigned_user',
            'added_member', 'removed_member'
        ]
    },
    entityType: {
        type: String,
        required: true,
        enum: ['board', 'list', 'task', 'user']
    },
    entityTitle: {
        type: String,
        default: ''
    },
    details: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for fetching board activity in chronological order
activitySchema.index({ board: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
