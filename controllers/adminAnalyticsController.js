const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

// Get admin dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments({ role: 'user' });

        // Get total orders count
        const totalOrders = await Order.countDocuments();

        // Get total products count
        const totalProducts = await Product.countDocuments();

        // Get total revenue
        const revenueResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.status(200).json({
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue
        });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        res.status(500).json({ message: 'Error fetching dashboard analytics', error: error.message });
    }
};

// Get monthly revenue data
exports.getMonthlyRevenue = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1); // January 1st of current year
        
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startDate },
                    status: { $ne: 'Cancelled' } // Exclude cancelled orders
                }
            },
            {
                $group: {
                    _id: { $month: '$orderDate' },
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 } // Sort by month
            },
            {
                $project: {
                    month: '$_id',
                    revenue: 1,
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Fill in missing months with zero revenue
        const monthsData = [];
        for (let i = 1; i <= 12; i++) {
            const monthData = monthlyRevenue.find(item => item.month === i) || { month: i, revenue: 0, count: 0 };
            monthsData.push(monthData);
        }

        res.status(200).json(monthsData);
    } catch (error) {
        console.error('Error fetching monthly revenue:', error);
        res.status(500).json({ message: 'Error fetching monthly revenue', error: error.message });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const productsByCategory = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'Cancelled' } // Exclude cancelled orders
                }
            },
            {
                $unwind: '$categoryQuantities'
            },
            {
                $group: {
                    _id: '$categoryQuantities.category',
                    count: { $sum: '$categoryQuantities.quantity' }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { count: -1 } // Sort by count in descending order
            }
        ]);

        res.status(200).json(productsByCategory);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Error fetching products by category', error: error.message });
    }
};

// Get recent orders
exports.getRecentOrders = async (req, res) => {
    try {
        const recentOrders = await Order.find()
            .populate({
                path: 'user',
                select: 'username email profilePic'
            })
            .populate({
                path: 'items.product',
                select: 'name price image'
            })
            .sort({ orderDate: -1 })
            .limit(10);

        // Transform the response to include detailed information
        const detailedOrders = recentOrders.map(order => {
            // Ensure user exists before accessing properties
            const user = order.user ? {
                username: order.user.username,
                email: order.user.email,
                profilePic: order.user.profilePic
            } : null;

            // Map items with null check for product
            const items = order.items.map(item => ({
                quantity: item.quantity,
                price: item.price,
                product: item.product ? {
                    name: item.product.name,
                    image: item.product.image
                } : null
            })).filter(item => item.product !== null); // Filter out items with null products

            return {
                _id: order._id,
                orderDate: order.orderDate,
                status: order.status,
                totalAmount: order.totalAmount,
                user,
                items
            };
        });

        res.status(200).json(detailedOrders);
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        res.status(500).json({ message: 'Error fetching recent orders', error: error.message });
    }
};