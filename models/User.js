// models/User.js
const mongoose = require('mongoose');
const Video = require('./Video');
const Comment = require('./Comment');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: 'https://cdn.dribbble.com/users/2442273/screenshots/11430325/media/f7c16720aa0680f356a6b863b7ddf23a.gif' },
    backgroundImg: { type: String, default: 'https://i.pinimg.com/originals/74/5c/c9/745cc90fcc688569610f84bc5d2b2fd6.gif' },
    bio: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
    watchedVideos: [
        {
            video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
            lastWatchedAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

// Middleware to remove associated videos and comments when user is deleted
userSchema.pre('remove', async function (next) {
    try {
        // Delete all videos created by this user
        await Video.deleteMany({ 'reactions.userId': this._id });
        
        // Delete all comments created by this user
        await Comment.deleteMany({ userId: this._id });

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('User', userSchema);

