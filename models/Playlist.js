const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }], // Reference to Video model
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
    videoCount: { type: Number, default: 0 }, // Field to track the number of videos
    createdAt: { type: Date, default: Date.now },
});

// Update videoCount whenever videos are added or removed
PlaylistSchema.methods.updateVideoCount = function() {
    this.videoCount = this.videos.length;
    return this.save();
};

const Playlist = mongoose.model('Playlist', PlaylistSchema);
module.exports = Playlist;
