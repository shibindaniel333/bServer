const Review = require('../models/reviewModel');

// Create a new review
exports.createReview = async (req, res) => {
    try {
        const { type, rating, comment } = req.body;
        
        // Validate required fields
        if (!type || !comment) {
            return res.status(400).json({
                message: 'Validation error',
                error: 'Type and comment are required fields'
            });
        }

        // Validate type enum values
        if (!['feedback', 'question'].includes(type)) {
            return res.status(400).json({
                message: 'Validation error',
                error: 'Type must be either "feedback" or "question"'
            });
        }

        // Validate rating for feedback type
        if (type === 'feedback' && (rating === undefined || rating < 0 || rating > 5)) {
            return res.status(400).json({
                message: 'Validation error',
                error: 'Rating is required for feedback and must be between 0 and 5'
            });
        }

        const userId = req.user.userId; // From auth middleware

        const review = new Review({
            userId,
            type,
            rating,
            comment
        });

        await review.save();

        res.status(201).json({
            message: 'Review submitted successfully',
            review
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Error submitting review', error: error.message });
    }
};

// Get all reviews (admin)
exports.getAllReviews = async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (type) filter.type = type;

        const reviews = await Review.find(filter)
            .populate('userId', 'username email profilePic')
            .populate('moderatedBy', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Get user's reviews
exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'username email profilePic')
            .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Update review status (admin)
exports.updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status, adminNote, response } = req.body;
        const adminId = req.user.userId;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.status = status;
        review.adminNote = adminNote;
        review.response = response;
        review.moderatedBy = adminId;
        review.moderatedAt = Date.now();

        await review.save();

        res.status(200).json({
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Error updating review', error: error.message });
    }
};

// Delete review (admin or owner)
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user is admin or review owner
        if (userRole !== 'admin' && review.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        await Review.findByIdAndDelete(reviewId);

        res.status(200).json({
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Error deleting review', error: error.message });
    }
};

// Get review statistics (admin)
exports.getReviewStats = async (req, res) => {
    try {
        const stats = await Review.aggregate([
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    feedbackCount: {
                        $sum: { $cond: [{ $eq: ['$type', 'feedback'] }, 1, 0] }
                    },
                    questionCount: {
                        $sum: { $cond: [{ $eq: ['$type', 'question'] }, 1, 0] }
                    },
                    pendingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.status(200).json(stats[0] || {
            totalReviews: 0,
            averageRating: 0,
            feedbackCount: 0,
            questionCount: 0,
            pendingCount: 0
        });
    } catch (error) {
        console.error('Error fetching review statistics:', error);
        res.status(500).json({ message: 'Error fetching review statistics', error: error.message });
    }
};

// Get all users' review information
exports.getAllUsersReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ type: 'feedback' })
            .populate('userId', 'username profilePic')
            .select('userId rating comment createdAt')
            .sort({ createdAt: -1 });

        // Transform the data to group reviews by user
        const usersReviews = reviews.reduce((acc, review) => {
            if (!review.userId) return acc;

            const user = {
                username: review.userId.username,
                profilePic: review.userId.profilePic,
                feedback: review.comment,
                rating: review.rating,
                createdAt: review.createdAt
            };

            return [...acc, user];
        }, []);

        res.status(200).json(usersReviews);
    } catch (error) {
        console.error('Error fetching users\'s reviews:', error);
        res.status(500).json({ message: 'Error fetching users\'s reviews', error: error.message });
    }
};