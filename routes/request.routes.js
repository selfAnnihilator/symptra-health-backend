const express = require('express');
const {
    getAllRequests,
    getPendingRequests,
    processRequest,
    bulkProcessRequests,
    createRequest,
    getUserRequests // ADD THIS LINE
} = require('../controllers/request.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route for creating a request (e.g., appointment booking)
router.post('/', authenticate, createRequest);

// Admin routes
router.get('/', authenticate, isAdmin, getAllRequests);
router.get('/pending', authenticate, isAdmin, getPendingRequests);
router.put('/:id/process', authenticate, isAdmin, processRequest);
router.post('/bulk-process', authenticate, isAdmin, bulkProcessRequests);

// User-specific routes
// Route to get all requests submitted by the authenticated user
router.get('/user', authenticate, getUserRequests); // ADD THIS NEW ROUTE

module.exports = router;
