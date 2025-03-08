const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'User ID is required']
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: [true, 'Product ID is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    totalPrice: {
        type: Number,
        required: true,
        min: [0, 'Total price cannot be negative']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to calculate total price
cartItemSchema.pre('save', function(next) {
    this.totalPrice = this.price * this.quantity;
    this.updatedAt = Date.now();
    next();
});

// Pre-update middleware to update the updatedAt timestamp
cartItemSchema.pre('findOneAndUpdate', function(next) {
    this._update.updatedAt = Date.now();
    if (this._update.price && this._update.quantity) {
        this._update.totalPrice = this._update.price * this._update.quantity;
    }
    next();
});

const cartItems = mongoose.model('cartItems', cartItemSchema);
module.exports = cartItems;