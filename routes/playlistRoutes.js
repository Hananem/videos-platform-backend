const express = require('express');
const router = express.Router();
const { 
    createPlaylist,
    updatePlaylist,
    deleteVideoFromPlaylist,
    getPlaylist,
    getAllPlaylists,
    deletePlaylist,
    
 } = require('../controllers/playlistController'); // Adjust path based on your project structure
const authMiddleware = require('../middleware/authMiddleware'); // Adjust path based on your project structure

// Route for creating a playlist
router.post('/', authMiddleware, createPlaylist);

// Get a single playlist by ID
router.get('/:id', getPlaylist); 


// Get all playlists or playlists by user ID
router.get('/', getAllPlaylists); 
// Route to update a playlist
router.put('/:id', authMiddleware, updatePlaylist);

// Route for deleting a video from a playlist
router.delete('/:id/videos/:videoId', authMiddleware, deleteVideoFromPlaylist);

// Delete a playlist
router.delete('/:id', authMiddleware, deletePlaylist); 

module.exports = router;
