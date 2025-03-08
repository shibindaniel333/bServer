const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const wishlistController = require('../controllers/wishlistController');
const orderController = require('../controllers/orderController');
const reviewController = require('../controllers/reviewController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const upload = require('../middleware/multerMiddleware');
const path = require('path');

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/preview-products', productController.getPreviewProducts);

// Protected routes
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, upload.single('profilePic'), userController.updateProfile);
router.post('/admin/create', authMiddleware, adminAuthMiddleware, userController.createAdmin);

// Product routes
router.get('/products', authMiddleware, productController.getAllProducts);
router.get('/products/:id', authMiddleware, productController.getProductById);
router.post('/add-product', authMiddleware, adminAuthMiddleware, upload.single('image'), productController.createProduct);

router.put('/update-product/:id', authMiddleware, adminAuthMiddleware, upload.single('image'), productController.updateProduct);

router.delete('/delete-product/:id', authMiddleware, adminAuthMiddleware, productController.deleteProduct);

// Cart routes
router.post('/cart/add', authMiddleware, cartController.addToCart);
router.get('/cart', authMiddleware, cartController.getCartItems);


router.put('/cart/:itemId', authMiddleware, cartController.updateCartItem);


router.delete('/cart/:itemId', authMiddleware, cartController.removeFromCart);
router.delete('/cart', authMiddleware, cartController.clearCart);

// Wishlist routes
       router.post('/wishlist/add', authMiddleware, wishlistController.addToWishlist);
router.get('/wishlist', authMiddleware, wishlistController.getWishlistItems);



router.delete('/wishlist/:itemId', authMiddleware, wishlistController.removeFromWishlist);
router.delete('/wishlist', authMiddleware, wishlistController.clearWishlist);

// Order routes
router.post('/orders', authMiddleware, orderController.createOrder);
router.get('/orders', authMiddleware,    orderController.getOrderHistory);


router.get('/orders/:id', authMiddleware, orderController.getOrderById);
router.put('/orders/:id/status', authMiddleware, adminAuthMiddleware, orderController.updateOrderStatus);


router.get('/admin/orders', authMiddleware, adminAuthMiddleware, orderController.getAllOrders);
 router.get('/admin/users/:userId/orders', authMiddleware, adminAuthMiddleware, orderController.getUserOrderHistory);

// Get all users (Admin only)
router.get('/admin/users', authMiddleware, adminAuthMiddleware, userController.getAllUsers);

// Delete user (Admin only)
router.delete('/admin/users/:id', authMiddleware, adminAuthMiddleware, userController.deleteUser);

// Admin Analytics routes
router.get('/admin/analytics/dashboard', authMiddleware, adminAuthMiddleware, adminAnalyticsController.getDashboardAnalytics);

   router.get('/admin/analytics/monthly-revenue', authMiddleware, adminAuthMiddleware, adminAnalyticsController.getMonthlyRevenue);
router.get('/admin/analytics/products-by-category', authMiddleware, adminAuthMiddleware, adminAnalyticsController.getProductsByCategory);


router.get('/admin/analytics/recent-orders', authMiddleware, adminAuthMiddleware, adminAnalyticsController.getRecentOrders);

// Review routes
router.get('/reviews/all', reviewController.getAllUsersReviews);

router.post('/reviews', authMiddleware, reviewController.createReview);

router.get('/reviews/user', reviewController.getUserReviews);


  router.get('/admin/reviews', authMiddleware, adminAuthMiddleware, reviewController.getAllReviews);
router.put('/admin/reviews/:reviewId', authMiddleware, adminAuthMiddleware, reviewController.updateReviewStatus);



router.delete('/reviews/:reviewId', authMiddleware,adminAuthMiddleware, reviewController.deleteReview)



router.get('/admin/reviews/stats', authMiddleware, adminAuthMiddleware, reviewController.getReviewStats);

module.exports = router;