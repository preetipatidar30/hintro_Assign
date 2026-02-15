const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ''
    },
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    assignees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    position: {
        type: Number,
        required: true,
        default: 0
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: {
        type: Date,
        default: null
    },
    labels: [{
        text: { type: String, maxlength: 30 },
        color: { type: String, default: '#6366f1' }
    }]
}, {
    timestamps: true
});

// Compound indexes for performance
taskSchema.index({ board: 1, list: 1, position: 1 });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ assignees: 1 });

module.exports = mongoose.model('Task', taskSchema);
