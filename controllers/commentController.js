const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Video = require('../models/Video');
const User = require('../models/User');
const { getIo } = require('../socket');
const mongoose = require('mongoose');
// Create a comment for a video
const createComment = async (req, res) => {
    try {
        const { videoId, text } = req.body;
        const userId = req.user.id;

        // Find the video and check if it exists
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Ensure `userId` exists in the `Video` document
        const videoCreatorId = video.createdBy; // Should be an ObjectId
        if (!videoCreatorId) {
            return res.status(404).json({ message: 'Video creator not found' });
        }

        // Log values for debugging
        console.log("videoCreatorId:", videoCreatorId);
        console.log("userId:", userId);

        // Create the comment
        const comment = new Comment({
            text,
            userId,
            videoId,
            likes: [],
            replies: [],
        });

        await comment.save();

        // Fetch the user details (username and profile picture)
        const user = await User.findById(userId).select('username profilePic');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create a notification if the commenter is not the video creator
        if (!videoCreatorId.equals(userId)) { 
            console.log("Creating notification...");// Use .equals for ObjectId comparison
            const notification = new Notification({
                recipient: videoCreatorId, // Directly use ObjectId
                sender: userId, // Directly use ObjectId
                type: 'comment',
                video: videoId, // Directly use ObjectId
                comment: comment._id, // Directly use ObjectId
                isRead: false,
            });
            console.log("Notification created:", notification);
            await notification.save();

            // Emit the notification via Socket.IO
            const io = getIo();
            io.to(videoCreatorId.toString()).emit('receiveNotification', notification);
        }

        res.status(201).json({
            message: 'Comment created successfully',
            comment: {
                _id: comment._id,
                text: comment.text,
                userId: user._id,
                username: user.username,
                profilePic: user.profilePic,
                createdAt: comment.createdAt,
            },
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Error creating comment', error: error.message });
    }
};

// Get all comments for a video
const getCommentsByVideo = async (req, res) => {
    try {
        const { videoId } = req.params;

        // Ensure the videoId is valid (optional)
        if (!videoId) {
            return res.status(400).json({ message: 'Video ID is required' });
        }

        // Fetch comments for the specified video
        const comments = await Comment.find({ video: videoId }) // Make sure 'video' is the correct field
            .populate('user', 'username') // Populate the user who made the comment
            .populate({
                path: 'replies', // Populate replies
                populate: { path: 'user', select: 'username' }, // Populate the user who made the reply
            })
            .sort({ createdAt: -1 }); // Sort by creation date in descending order

        // Return comments along with a count
        res.status(200).json({ count: comments.length, comments });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};


// Update a comment or reply
const updateCommentOrReply = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Ensure only the comment/reply owner can update it
        if (comment.userId.toString() !== req.user.id) { // Use userId field
            return res.status(403).json({ message: 'Unauthorized to update this comment/reply' });
        }

        comment.text = text;
        await comment.save();

        res.status(200).json({ message: 'Comment/reply updated successfully', comment });
    } catch (error) {
        res.status(500).json({ message: 'Error updating comment/reply', error: error.message });
    }
};


// Delete a comment or reply
const deleteCommentOrReply = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Ensure only the comment/reply owner can delete it
        if (comment.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment/reply' });
        }

        // Remove the comment
        await Comment.findByIdAndDelete(commentId); // This will delete the comment

        // Remove the comment reference from the video if it's a top-level comment
        if (!comment.parentComment) {
            const video = await Video.findById(comment.video);
            if (video) {
                video.comments.pull(comment._id);
                await video.save();
            }
        }

        res.status(200).json({ message: 'Comment/reply deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment/reply', error: error.message });
    }
};



// Reply to a comment
const replyToComment = async (req, res) => {
    try {
        const { commentId } = req.params; // Extract the commentId from the request parameters
        const { text } = req.body; // Extract the text from the request body
        const userId = req.user.id; // Get the userId from the authenticated user's request

        // Find the parent comment to get the videoId and userId of the comment owner
        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return res.status(404).json({ message: 'Parent comment not found' });
        }
3
        // Create the reply as a comment
        const reply = new Comment({
            text,
            userId, // Use userId field for the reply
            videoId: parentComment.videoId, // Use the videoId from the parent comment
            replies: [], // Initialize replies as an empty array
        });

        await reply.save(); // Save the reply

        // Add the reply to the parent comment
        parentComment.replies.push(reply._id);
        await parentComment.save();

        // Create a notification for the user who made the original comment
        if (!parentComment.userId.equals(userId)) { // Avoid notifying the user who replied
            const notification = new Notification({
                recipient: parentComment.userId, // The user who made the original comment
                sender: userId, // The user who is replying
                type: 'reply', // Type of notification
                video: parentComment.videoId, // Optional reference to the video
                comment: parentComment._id, // Reference to the original comment
                isRead: false, // Set as unread
            });
            await notification.save();

            // Emit the notification via Socket.IO
            const io = getIo();
            io.to(parentComment.userId.toString()).emit('receiveNotification', notification);
        }

        res.status(201).json({ message: 'Reply added successfully', reply });
    } catch (error) {
        res.status(500).json({ message: 'Error adding reply', error: error.message });
    }
};





// Toggle like/unlike on a comment
const toggleLikeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const hasLiked = comment.likes.includes(userId);

        if (hasLiked) {
            // Unlike the comment
            comment.likes.pull(userId);
        } else {
            // Like the comment
            comment.likes.push(userId);
        }

        // Create a notification for the user who made the original comment
        if (!comment.userId.equals(userId)) { // Avoid notifying the user who liked their own comment
            const notification = new Notification({
                recipient: comment.userId, // The user who made the original comment
                sender: userId, // The user who is liking
                type: 'like', // Type of notification
                video: comment.videoId, // Reference to the video
                comment: comment._id, // Reference to the liked comment
                isRead: false, // Set as unread
            });
            await notification.save();

            // Emit the notification via Socket.IO
            const io = getIo();
            io.to(comment.userId.toString()).emit('receiveNotification', notification);
        }

        await comment.save();

        res.status(200).json({ message: hasLiked ? 'Unliked comment' : 'Liked comment', comment });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling like', error: error.message });
    }
};



module.exports = {
    createComment,
    getCommentsByVideo,
    updateCommentOrReply,
    deleteCommentOrReply,
    replyToComment,
    toggleLikeComment,
};
