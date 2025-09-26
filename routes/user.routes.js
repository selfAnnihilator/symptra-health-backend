const express = require('express');
const {
    getUserProfile,
    updateUserProfile, // Import this
    getAllUsers,
    deleteUser
} = require('../controllers/user.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// User profile routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile); // ADD THIS LINE for PUT request

// Admin user management routes
router.get('/', authenticate, isAdmin, getAllUsers);
router.delete('/:id', authenticate, isAdmin, deleteUser);

module.exports = router;
