const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  type: {
    type: String,
    enum: ['feedback', 'question'],
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    required: function() {
      return this.type === 'feedback';
    }
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  response: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNote: {
    type: String,
    trim: true
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  moderatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual field to get user's profile information
reviewSchema.virtual('user', {
  ref: 'users',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  // Select specific fields from user profile
  options: {
    select: 'username email profilePic'
  }
});

// Ensure virtuals are included in JSON output
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;