const users = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
    console.log("inside register");
    
    try {
        const { username, email, password, profilePic } = req.body;

        // Check if user already exists
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new users({
            username,
            email,
            password: hashedPassword,
            profilePic: profilePic || null
        });
        // Save user to database
        await newUser.save();

        res.status(201).json(newUser);
    } catch (error) {
        console.log(" error inside register");
        
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        console.log('Login attempt with email:', req.body.email);
        const { email, password } = req.body;

        // Check if user exists and include role in the query
        const user = await users.findOne({ email }).select('+password +role');
        console.log('User found:', user ? 'Yes' : 'No');
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(400).json({ message: 'Email not registered' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch ? 'Yes' : 'No');
        if (!isMatch) {
            console.log('Login failed: Password mismatch');
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // Generate JWT token with role information
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role || 'user' // Ensure role is included, default to 'user'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );

        // Log successful login with role
        console.log(`Login successful for ${user.email} with role: ${user.role}`);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await users.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, email } = req.body;

        // Check if user exists
        const user = await users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If email is being updated, check if new email already exists
        if (email && email !== user.email) {
            const emailExists = await users.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update profile picture if provided
        let profilePic = user.profilePic;
        if (req.file) {
            profilePic = req.file.filename;
        }

        // Update user
        const updatedUser = await users.findByIdAndUpdate(
            userId,
            {
                username: username || user.username,
                email: email || user.email,
                profilePic: profilePic
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.log('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

// Create admin user
exports.createAdmin = async (req, res) => {
    try {
        const { username, email, password, profilePic } = req.body;

        // Check if user already exists
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin user
        const newAdmin = new users({
            username,
            email,
            password: hashedPassword,
            profilePic: profilePic || null,
            role: 'admin' // Set role as admin
        });

        // Save admin to database
        await newAdmin.save();

        res.status(201).json({
            message: 'Admin user created successfully',
            admin: {
                id: newAdmin._id,
                username: newAdmin.username,
                email: newAdmin.email,
                role: newAdmin.role,
                profilePic: newAdmin.profilePic
            }
        });
    } catch (error) {
        console.log('Error creating admin user:', error);
        res.status(500).json({ message: 'Error creating admin user', error: error.message });
    }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const allUsers = await users.find({ role: 'user' }).select('-password');
        res.status(200).json(allUsers);
    } catch (error) {
        console.log('Error fetching all users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const userToDelete = await users.findById(userId);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deletion of admin users
        if (userToDelete.role === 'admin') {
            return res.status(403).json({ message: 'Admin users cannot be deleted' });
        }

        // Delete only cart and wishlist data
        await Promise.all([
            // Delete user's cart items
            require('../models/cartModel').deleteMany({ user: userId }),
            // Delete user's wishlist items
            require('../models/wishlistModel').deleteMany({ user: userId })
            // Note: Order and review data are intentionally preserved
        ]);

        // Delete the user
        await users.findByIdAndDelete(userId);

        res.status(200).json({
            message: 'User account deleted successfully. Order history and reviews have been preserved.'
        });
    } catch (error) {
        console.log('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

