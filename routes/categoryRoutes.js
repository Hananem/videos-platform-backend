// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const createUploadMiddleware = require('../middleware/multerMiddleware');// Import the multer middleware

// Public routes
router.get('/', categoryController.getAllCategories); // Get all categories
router.get('/popular', categoryController.getPopularCategories); // Get popular categories

// Protected routes
router.post('/', authMiddleware, createUploadMiddleware('image'), categoryController.createCategory); // Create a new category
router.put('/:id', authMiddleware, createUploadMiddleware('image'), categoryController.updateCategory); // Update a category
router.delete('/:id', authMiddleware, categoryController.deleteCategory); // Delete a category

module.exports = router;
