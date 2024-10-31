const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/videos/';
        // Check if the directory exists; create it if it doesn't
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir); // Directory to store videos
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Save the video with a unique name
    },
});

// Supported file types for videos
const filetypes = /mp4|mov|avi|mkv|flv|wmv|webm|mpeg|3gp|ogg/;

// File filter to accept only the specified video files
const videoFilter = (req, file, cb) => {
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true); // Accept file
    }
    cb(new Error('Only video files are allowed! Supported formats: mp4, mov, avi, mkv, flv, wmv, webm, mpeg, 3gp, ogg.')); // Reject file
};

// Initialize Multer upload for videos
const upload = multer({
    storage: storage,
    fileFilter: videoFilter,
    limits: { fileSize: 500000000 }, // Limit the file size to 500MB
});

module.exports = upload;
