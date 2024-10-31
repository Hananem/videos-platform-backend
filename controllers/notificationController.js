const Notification = require('../models/Notification'); // Import Notification model
const User = require('../models/User'); // Import User model

// Create a new notification
const createNotification = async (req, res) => {
    try {
        const { recipient, sender, type, video, comment, message } = req.body;

        // Create a new notification
        const notification = new Notification({
            recipient,
            sender,
            type,
            video,
            comment,
            message,
        });

        await notification.save();

        // Optionally, emit the notification to the recipient using Socket.IO
        const io = require('../socket'); // Adjust the path as necessary
        io.getIo().to(recipient.toString()).emit('receiveNotification', notification);

        res.status(201).json({ message: 'Notification created successfully', notification });
    } catch (error) {
        res.status(500).json({ message: 'Error creating notification', error: error.message });
    }
};

// Get notifications for the current user
const getUserNotifications = async (req, res) => {
    try {
        const currentUserId = req.user._id; // Get the current user's ID from the request object

        // Fetch notifications for the user
        const notifications = await Notification.find({ recipient: currentUserId })
            .populate('sender', 'username profilePic') // Optionally populate sender details
            .sort({ createdAt: -1 }); // Sort by the most recent first

        res.status(200).json({ message: 'Notifications fetched successfully', notifications });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params; // Get notification ID from request parameters
        const currentUserId = req.user._id; // Get the current user's ID

        // Find the notification and update its isRead status
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: currentUserId }, // Ensure the notification belongs to the user
            { isRead: true }, // Update the isRead field
            { new: true } // Return the updated notification
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found or already read' });
        }

        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        res.status(500).json({ message: 'Error marking notification as read', error: error.message });
    }
};


module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead
};
