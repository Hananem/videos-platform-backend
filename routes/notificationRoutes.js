const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Adjust the path as necessary
const {
    createNotification,
    getUserNotifications,
    markAsRead
} = require('../controllers/notificationController'); // Adjust the path as necessary

// Create a new notification (authenticated)
router.post('/', authMiddleware, createNotification);

// Get notifications for the current user (authenticated)
router.get('/', authMiddleware, getUserNotifications);

// Mark notification as read (authenticated)
router.patch('/:notificationId/read', authMiddleware, markAsRead);
module.exports = router;
