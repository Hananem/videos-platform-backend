// models/category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    image: { type: String, required: true }, // URL to the category image
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who created the category
    updatedAt: { type: Date, default: Date.now }, // Timestamp of last update
    isActive: { type: Boolean, default: true }, // Is category active
    order: { type: Number, default: 0 } // Order for display purposes
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
