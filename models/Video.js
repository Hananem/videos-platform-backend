// models/Video.js
const mongoose = require('mongoose');
const Comment = require('./Comment');

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, required: true },
    tags: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    reactions: [{
        type: {
            type: String,
            enum: ['like', 'love', 'haha', 'angry', 'sad'],
            required: true
        },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    views: { type: Number, default: 0 },
    reactionCount: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    privacyStatus: {
        type: String,
        enum: ['public', 'private', 'follower'],
        default: 'public'
    },
    createdAt: { type: Date, default: Date.now }
});

// Middleware to delete associated comments when video is deleted
videoSchema.pre('remove', async function (next) {
    try {
        await Comment.deleteMany({ videoId: this._id });
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Video', videoSchema);

