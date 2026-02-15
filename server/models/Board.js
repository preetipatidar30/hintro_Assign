const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Board title is required'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    background: {
        type: String,
        default: '#6366f1'
    }
}, {
    timestamps: true
});

// Index for fast querying by member
boardSchema.index({ members: 1 });
boardSchema.index({ owner: 1 });

module.exports = mongoose.model('Board', boardSchema);
