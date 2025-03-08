const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create a compound index to ensure a user can't add the same product twice
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('wishlist', wishlistSchema);