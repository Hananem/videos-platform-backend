const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const upload = require('../middleware/multerConfig');
const authMiddleware = require('../middleware/authMiddleware');
// Create a new video (POST)
router.post('/upload',authMiddleware, upload.single('video'), videoController.createVideo);

// Get all videos (GET)
router.get('/', videoController.getAllVideos);

// Get a single video by ID (GET)
router.get('/:videoId', videoController.getVideoById);

// Update a video (PUT)
router.put('/:id',authMiddleware, upload.single('video'), videoController.updateVideo);

// Delete a video (DELETE)
router.delete('/:id',authMiddleware, videoController.deleteVideo);

// Add or remove a reaction to/from a video
router.post('/:videoId/reactions', authMiddleware, videoController.toggleReaction);

// Route to toggle save for a video
router.post('/:videoId/save', authMiddleware, videoController.saveToggle);

// Route to get a sharable link for a video
router.get('/:videoId/share', authMiddleware, videoController.getVideoLink);

module.exports = router;
