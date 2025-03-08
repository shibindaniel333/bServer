const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        unique: true,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Soft Drinks', 'Energy Drinks', 'Coffee', 'Tea', 'Smoothies', 'Mocktails', 'Water', 'Sports Drinks', 'Wine'],
        trim: true
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    image: {
        type: String,
        required: [true, 'Product image is required']
    },
    nutrition: {
        calories: {
            type: String,
            required: [true, 'Calorie information is required']
        },
        sugar: {
            type: String,
            required: [true, 'Sugar content information is required']
        },
        caffeine: {
            type: String,
            required: [true, 'Caffeine content information is required']
        },
        serving: {
            type: String,
            required: [true, 'Serving size information is required']
        }
    },
    rating: {
        type: Number,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot be more than 5'],
        default: 0
    },
    reviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const products = mongoose.model('products', productSchema);
module.exports = products;