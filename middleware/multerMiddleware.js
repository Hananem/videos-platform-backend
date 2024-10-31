// middleware/multerMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed file types for image uploads
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

// Ensure the upload directory exists
const createUploadDirectory = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true }); // Create the directory if it doesn't exist
    }
};

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/images'; // Directory for profile images
        createUploadDirectory(uploadDir); // Ensure the directory exists
        cb(null, uploadDir); // Set the destination to the specified directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Append unique identifier to file name
    }
});

// Multer filter to validate file types
const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'), false); // Reject the file
    }
};

// Function to create upload middleware dynamically based on field name
const createUploadMiddleware = (fieldName) => {
    return (req, res, next) => {
        const upload = multer({
            storage,
            limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
            fileFilter
        }).single(fieldName); // Use the dynamic field name

        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: err.message }); // Send error message
            }
            next(); // Proceed to the next middleware/controller
        });
    };
};

// Export the createUploadMiddleware function
module.exports = createUploadMiddleware;

