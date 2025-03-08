const cartItems = require('../models/cartModel');
const products = require('../models/productModel');

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.userId;

        // Validate product existence and stock
        const product = await products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        // Check if item already exists in cart
        let cartItem = await cartItems.findOne({ user: userId, product: productId });

        if (cartItem) {
            // Update quantity if item exists
            cartItem.quantity += quantity;
            cartItem.totalPrice = cartItem.price * cartItem.quantity;
            await cartItem.save();
        } else {
            // Create new cart item
            cartItem = new cartItems({
                user: userId,
                product: productId,
                quantity,
                price: product.price,
                totalPrice: product.price * quantity
            });
            await cartItem.save();
        }

        res.status(200).json({
            message: 'Item added to cart successfully',
            cartItem
        });
    } catch (error) {
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
};

// Get user's cart items
exports.getCartItems = async (req, res) => {
    try {
        const userId = req.user.userId;
        const items = await cartItems.find({ user: userId })
            .populate('product', 'name price image');

        // Filter out items with deleted products
        const validItems = items.filter(item => item.product !== null);

        // If some items were filtered out, clean up the cart
        if (validItems.length < items.length) {
            const invalidItems = items.filter(item => item.product === null);
            await cartItems.deleteMany({
                _id: { $in: invalidItems.map(item => item._id) }
            });
        }

        res.status(200).json(validItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart items', error: error.message });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.userId;

        // Validate quantity
        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        // Find and update cart item
        const cartItem = await cartItems.findOne({ _id: itemId, user: userId });
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Check product stock
        const product = await products.findById(cartItem.product);
        if (!product || product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.status(200).json({
            message: 'Cart item updated successfully',
            cartItem
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart item', error: error.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.userId;

        const result = await cartItems.findOneAndDelete({ _id: itemId, user: userId });
        if (!result) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        res.status(200).json({
            message: 'Item removed from cart successfully',
            removedItem: result
        });
    } catch (error) {
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        await cartItems.deleteMany({ user: userId });

        res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
};