// routes/userRoutes.js
const express = require('express');
const { 
    updateUserProfile,
    removeBio,
    followUser, 
    unfollowUser,
    getUserById,
    uploadProfilePic,
    uploadBackgroundImage,
    removeProfilePic,
    removeBackgroundImage,
    getFollowedUsersVideos,
    getSuggestedVideos,
    watchVideo
} = require('../controllers/userController'); // Adjust the path as necessary
const authMiddleware = require('../middleware/authMiddleware');
const createUploadMiddleware = require('../middleware/multerMiddleware');
const router = express.Router();

// Route to get user by ID
router.get('/:id', getUserById);

// Route to update user profile
router.put('/profile', authMiddleware, updateUserProfile);

// Route to remove bio
router.delete('/bio', authMiddleware, removeBio);

// Route to upload profile picture
router.post('/profile-pic', authMiddleware, createUploadMiddleware('profilePic'), uploadProfilePic);

// Route to upload background image
router.post('/background-img', authMiddleware, createUploadMiddleware('backgroundImage'), uploadBackgroundImage);

// Route to remove profile picture
router.delete('/profile-pic', authMiddleware, removeProfilePic);

// Route to remove background image
router.delete('/background-img', authMiddleware, removeBackgroundImage);

router.get('/followed', authMiddleware, getFollowedUsersVideos);
// Follow a user
router.post('/follow/:userId', authMiddleware, followUser);

// Unfollow a user
router.post('/unfollow/:userId', authMiddleware, unfollowUser);

// Route for getting suggested videos
router.get('/suggestions', authMiddleware, getSuggestedVideos);

//route for watchVideo
router.post('/watch/:videoId', authMiddleware, watchVideo);

module.exports = router;
