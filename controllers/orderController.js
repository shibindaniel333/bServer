const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { customerDetails, items } = req.body;
        const userId = req.user.userId;

        // Validate customer details
        if (!customerDetails || !customerDetails.name || !customerDetails.location) {
            return res.status(400).json({ message: 'Customer details are required' });
        }

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order items are required' });
        }

        // Calculate total amount and validate stock
        let totalAmount = 0;
        // Track categories and quantities
        const categoryMap = new Map();
        
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.product}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for product: ${product.name}`,
                    available: product.stock,
                    requested: item.quantity
                });
            }
            totalAmount += item.price * item.quantity;

            // Update product stock
            product.stock -= item.quantity;
            await product.save();
            
            // Track category quantities
            const category = product.category;
            const currentQuantity = categoryMap.get(category) || 0;
            categoryMap.set(category, currentQuantity + item.quantity);
        }
        
        // Convert category map to array of objects
        const categoryQuantities = Array.from(categoryMap.entries()).map(([category, quantity]) => ({
            category,
            quantity
        }));

        // Create new order
        const newOrder = new Order({
            user: userId,
            customerDetails,
            items,
            categoryQuantities,
            totalAmount,
            status: 'Pending'
        });

        await newOrder.save();

        // Clear user's cart after successful order
        await Cart.deleteMany({ user: userId });

        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

// Get user's order history
exports.getOrderHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await Order.find({ user: userId })
            .populate('items.product', 'name price image')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order history', error: error.message });
    }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name price image');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the user is authorized to view this order
        if (order.user.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        // Validate status
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Invalid status',
                validStatuses
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If order is being cancelled, restore product stock
        if (status === 'Cancelled' && order.status !== 'Cancelled') {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'username email')
            .populate('items.product', 'name price image')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Get order history for a specific user (Admin only)
exports.getUserOrderHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find all orders for the specified user
        const userOrders = await Order.find({ user: userId })
            .populate('user', 'username email')
            .populate('items.product', 'name price image')
            .sort({ createdAt: -1 });

        // Calculate total purchase amount across all orders
        const totalPurchaseAmount = userOrders.reduce((total, order) => total + order.totalAmount, 0);

        // Extract unique delivery locations
        const locations = [...new Set(userOrders.map(order => order.customerDetails.location))];

        res.status(200).json({
            orders: userOrders,
            totalPurchaseAmount,
            locations,
            orderCount: userOrders.length
        });
    } catch (error) {
        console.error('Error fetching user order history:', error);
        res.status(500).json({ message: 'Error fetching user order history', error: error.message });
    }
};

