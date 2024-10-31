const Playlist = require('../models/Playlist');
const Video = require('../models/Video');


const createPlaylist = async (req, res) => {
    try {
        const { title, description, videoIds } = req.body;

        // Create a new Playlist instance with userId
        const newPlaylist = new Playlist({
            title,
            description,
            videos: videoIds, // Store the video IDs
            createdBy: req.user._id, // Set the user ID of the creator
        });

        await newPlaylist.save(); // Save the new playlist to the database

        // Update video count
        await newPlaylist.updateVideoCount();

        // Populate video details in the response
        const populatedPlaylist = await Playlist.findById(newPlaylist._id)
            .populate('videos'); // Populate video details

        res.status(201).json({
            message: 'Playlist created successfully',
            playlist: populatedPlaylist, // Send the populated playlist
        });
    } catch (error) {
        console.error('Error creating playlist:', error); // Log the error for debugging
        res.status(500).json({ message: 'Error creating playlist', error: error.message });
    }
};

const updatePlaylist = async (req, res) => {
    try {
        const { title, description, videoIds } = req.body;

        // Validate and check if user owns the playlist
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        if (!playlist.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update fields if provided
        if (title) playlist.title = title;
        if (description) playlist.description = description;
        if (videoIds) {
            playlist.videos = [...new Set(videoIds)]; // Avoid duplicates
            await playlist.updateVideoCount(); // Update video count
        }

        await playlist.save();
        
        res.status(200).json({ message: 'Playlist updated successfully', playlist });
    } catch (error) {
        res.status(500).json({ message: 'Error updating playlist', error: error.message });
    }
};

// 6. Delete a video from a specific playlist
const deleteVideoFromPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        if (!playlist.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Remove the video ID from the videos array
        playlist.videos = playlist.videos.filter(videoId => !videoId.equals(req.params.videoId));

        await playlist.updateVideoCount(); // Update the videoCount after deletion
        await playlist.save();
        
        res.status(200).json({ message: 'Video removed from playlist successfully', playlist });
    } catch (error) {
        res.status(500).json({ message: 'Error removing video from playlist', error: error.message });
    }
};

// 2. Get a single playlist by ID
// 1. Get a single playlist by ID
const getPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id).populate('videos');
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        
        res.status(200).json(playlist);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving playlist', error: error.message });
    }
};

// 2. Get all playlists or only playlists by a specific user
const getAllPlaylists = async (req, res) => {
    try {
        const query = req.query.userId ? { createdBy: req.query.userId } : {};
        const playlists = await Playlist.find(query).populate('videos');
        
        res.status(200).json(playlists);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving playlists', error: error.message });
    }
};

// 5. Delete a playlist
const deletePlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        if (!playlist.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Playlist.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting playlist', error: error.message });
    }
};




module.exports = {
    createPlaylist,
    updatePlaylist,
    deleteVideoFromPlaylist,
    getPlaylist,
    getAllPlaylists,
    deletePlaylist
};

