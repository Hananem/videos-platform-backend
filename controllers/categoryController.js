// controllers/categoryController.js
const Category = require('../models/Category');

const categoryController = {
    createCategory: async (req, res) => {
        try {
            const { name, slug } = req.body;
            const image = req.file.path; // Path to the uploaded image
            const createdBy = req.user.id; // Assuming you are using an auth middleware

            const newCategory = new Category({ name, slug, image, createdBy });
            await newCategory.save();

            res.status(201).json({ message: 'Category created successfully', category: newCategory });
        } catch (error) {
            res.status(500).json({ message: 'Error creating category', error: error.message });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, slug } = req.body;
            const updatedData = { name, slug };

            if (req.file) {
                updatedData.image = req.file.path; // Update image if a new one is uploaded
            }

            const updatedCategory = await Category.findByIdAndUpdate(id, updatedData, { new: true });
            if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });

            res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
        } catch (error) {
            res.status(500).json({ message: 'Error updating category', error: error.message });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedCategory = await Category.findByIdAndDelete(id);
            if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });

            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting category', error: error.message });
        }
    },

    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.find();
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching categories', error: error.message });
        }
    },

    getPopularCategories: async (req, res) => {
        try {
            const popularCategories = await Category.aggregate([
                { $match: { isActive: true } }, // Match only active categories
                { $lookup: {
                    from: 'videos', // Assuming your videos collection is called 'videos'
                    localField: '_id',
                    foreignField: 'category', // Assuming your video schema has a 'category' field
                    count: 'videoCount' // Count the number of videos in each category
                }},
                { $sort: { videoCount: -1 } }, // Sort by video count in descending order
                { $limit: 10 } // Limit to top 10 categories
            ]);

            res.status(200).json(popularCategories);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching popular categories', error: error.message });
        }
    }
};

module.exports = categoryController;
