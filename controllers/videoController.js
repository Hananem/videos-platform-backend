const Video = require('../models/Video');
const path = require('path');
const Notification = require('../models/Notification');
const { getIo } = require('../socket');


const createVideo = async (req, res) => {
    try {
        const { title, description, tags, categoryId, privacyStatus } = req.body;

        // Check if video file is provided
        if (!req.file) {
            return res.status(400).json({ message: 'Video file is required' });
        }

        // Validate privacyStatus
        const validPrivacyStatuses = ['public', 'private', 'follower'];
        if (!validPrivacyStatuses.includes(privacyStatus)) {
            return res.status(400).json({ message: 'Invalid privacy status' });
        }

        const videoUrl = req.file.path; // Get the path of the uploaded video file

        // Create a new Video instance with userId
        const newVideo = new Video({
            title,
            description,
            videoUrl,
            tags: tags ? tags.split(',') : [], // Split tags into an array if provided
            category: categoryId, // Ensure categoryId is provided in the request
            createdBy: req.user._id, // Set the user ID of the creator
            privacyStatus, // Set the privacy status
        });

        await newVideo.save(); // Save the new video to the database

        // Prepare response with user details
        const responseVideo = {
            _id: newVideo._id,
            title: newVideo.title,
            description: newVideo.description,
            videoUrl: newVideo.videoUrl,
            tags: newVideo.tags,
            views: newVideo.views,
            reactionCount: newVideo.reactionCount,
            comments: newVideo.comments,
            createdAt: newVideo.createdAt,
            createdBy: {
                id: req.user._id,
                username: req.user.username, // Include username
                profilePic: req.user.profilePic, // Include profile picture
            },
            privacyStatus: newVideo.privacyStatus, // Include privacy status
        };

        res.status(201).json({ message: 'Video created successfully', video: responseVideo });
    } catch (error) {
        console.error('Error creating video:', error); // Log the error for debugging
        res.status(500).json({ message: 'Error creating video', error: error.message });
    }
};



// Get all videos
const getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find();
        res.status(200).json(videos);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching videos', error: error.message });
    }
};

// Get a single video by ID
const getVideoById = async (req, res) => {
    try {
        const { videoId } = req.params;
        
        // Find the video and populate the creator field
        const video = await Video.findById(videoId).populate('createdBy');

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Check the video’s privacy status
        if (video.privacyStatus === 'private') {
            return res.status(403).json({ message: 'This video is private' });
        } else if (video.privacyStatus === 'follower') {
            // Check if the requesting user is a follower
            const isFollower = video.createdBy.followers.some(followerId => 
                followerId.equals(req.user?._id)  // Use equals for ObjectId comparison
            );

            if (!isFollower) {
                return res.status(403).json({ message: 'Only followers can view this video' });
            }
        }

        // If public or allowed by privacy status, return the video details
        res.status(200).json({ video });
    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).json({ message: 'Error fetching video', error: error.message });
    }
};



// Update a video
const updateVideo = async (req, res) => {
    try {
        const { title, description, tags } = req.body;
        const videoUrl = req.file ? req.file.path : req.body.videoUrl; // Keep the existing video if not updated

        const video = await Video.findByIdAndUpdate(
            req.params.id,
            { title, description, videoUrl, tags: tags ? tags.split(',').map(tag => tag.trim()) : [] },
            { new: true }
        );

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        res.status(200).json({ message: 'Video updated successfully', video });
    } catch (error) {
        res.status(500).json({ message: 'Error updating video', error: error.message });
    }
};

// Delete a video
const deleteVideo = async (req, res) => {
    try {
        const video = await Video.findByIdAndDelete(req.params.id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Optionally: Delete the video file from the server (if stored locally)
        const videoPath = path.join(__dirname, '..', video.videoUrl);
        fs.unlinkSync(videoPath);

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting video', error: error.message });
    }
};


const toggleReaction = async (req, res) => {
    try {
        const { videoId } = req.params;
        const { type } = req.body; // Reaction type: 'like', 'love', 'haha', 'angry', 'sad'
        const userId = req.user.id; // Authenticated user ID

        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Check if the user has already reacted
        const existingReactionIndex = video.reactions.findIndex(reaction => 
            reaction.userId.toString() === userId && reaction.type === type
        );

        if (existingReactionIndex > -1) {
            // If reaction exists, remove it
            video.reactions.splice(existingReactionIndex, 1);
            video.reactionCount -= 1; // Decrease reaction count
            await video.save();

            return res.status(200).json({ message: 'Reaction removed', video });
        } else {
            // If reaction doesn't exist, add it
            video.reactions.push({ type, userId });
            video.reactionCount += 1; // Increase reaction count
            await video.save();

            // Send a notification if the reaction is from a different user than the video creator
            if (video.createdBy.toString() !== userId) {
                const notification = new Notification({
                    recipient: video.createdBy, // Video creator
                    sender: userId, // User who reacted
                    type: 'reaction', // Notification type
                    video: videoId, // Referencing the video
                    isRead: false,
                    message: `${req.user.username} reacted to your video with ${type}.`
                });

                await notification.save();

                // Emit notification using Socket.IO
                const io = getIo();
                io.to(video.createdBy.toString()).emit('receiveNotification', notification);
            }

            return res.status(200).json({ message: 'Reaction added', video });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error toggling reaction', error: error.message });
    }
};


const saveToggle = async (req, res) => {
    try {
        const { videoId } = req.params; // Extract videoId from request parameters
        const userId = req.user.id; // Get user ID from the request

        const user = await User.findById(userId);
        const video = await Video.findById(videoId);

        if (!user || !video) {
            return res.status(404).json({ message: 'User or Video not found' });
        }

        // Check if the video is already saved by the user
        const hasSaved = user.savedVideos.includes(videoId);

        if (hasSaved) {
            // Unsaving the video
            user.savedVideos.pull(videoId);
        } else {
            // Saving the video
            user.savedVideos.push(videoId);
        }

        await user.save(); // Save the updated user data

        res.status(200).json({
            message: hasSaved ? 'Video unsaved' : 'Video saved',
            savedVideos: user.savedVideos,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling save', error: error.message });
    }
}

// Controller to get video details and generate a shareable link
const getVideoLink = async (req, res) => {
    try {
        const { videoId } = req.params;

        // Find the video by ID
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Construct the shareable link to the frontend video player page
        const videoLink = `${req.protocol}://${req.get('host')}/watch/${videoId}`;

        res.status(200).json({
            message: 'Video link generated successfully',
            videoLink,  // This is the sharable link to the video
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating video link', error: error.message });
    }
};

const updatePrivacyStatus = async (req, res) => {
    try {
        const { videoId } = req.params;
        const { privacyStatus } = req.body;
        const validPrivacyStatuses = ['public', 'private', 'follower'];

        // Validate privacyStatus
        if (!validPrivacyStatuses.includes(privacyStatus)) {
            return res.status(400).json({ message: 'Invalid privacy status' });
        }

        // Find the video by ID
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Check if the current user is the creator of the video
        if (video.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to update this video' });
        }

        // Update the privacyStatus
        video.privacyStatus = privacyStatus;
        await video.save();

        res.status(200).json({
            message: 'Privacy status updated successfully',
            video: {
                _id: video._id,
                title: video.title,
                privacyStatus: video.privacyStatus,
                updatedAt: video.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error updating privacy status:', error);
        res.status(500).json({ message: 'Error updating privacy status', error: error.message });
    }
};

module.exports = {
    createVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    toggleReaction,
    saveToggle,
    getVideoLink
};
