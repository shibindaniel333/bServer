const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.userId;

        // Validate product existence
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Create new wishlist item
        const wishlistItem = new Wishlist({
            user: userId,
            product: productId
        });

        await wishlistItem.save();

        res.status(200).json({
            message: 'Item added to wishlist successfully',
            wishlistItem
        });
    } catch (error) {
        // Handle duplicate entry error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Item already in wishlist' });
        }
        res.status(500).json({ message: 'Error adding item to wishlist', error: error.message });
    }
};

// Get user's wishlist items
exports.getWishlistItems = async (req, res) => {
    try {
        const userId = req.user.userId;
        const items = await Wishlist.find({ user: userId })
            .populate('product', 'name price image description category');

        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wishlist items', error: error.message });
    }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.userId;

        const result = await Wishlist.findOneAndDelete({ _id: itemId, user: userId });
        if (!result) {
            return res.status(404).json({ message: 'Wishlist item not found' });
        }

        res.status(200).json({
            message: 'Item removed from wishlist successfully',
            removedItem: result
        });
    } catch (error) {
        res.status(500).json({ message: 'Error removing item from wishlist', error: error.message });
    }
};

// Clear wishlist
exports.clearWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        await Wishlist.deleteMany({ user: userId });

        res.status(200).json({ message: 'Wishlist cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing wishlist', error: error.message });
    }
};