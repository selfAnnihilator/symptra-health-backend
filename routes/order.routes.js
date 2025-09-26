const express = require('express');
const {
    createOrder,
    getOrderById,
    getMyOrders,
    getAllOrders,
    updateOrderToPaid,
    updateOrderToDelivered
} = require('../controllers/order.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// User routes for orders
router.post('/', authenticate, createOrder); // Create an order
router.get('/myorders', authenticate, getMyOrders); // Get logged-in user's orders
router.get('/:id', authenticate, getOrderById); // Get a single order by ID

// Admin routes for orders
router.get('/', authenticate, isAdmin, getAllOrders); // Get all orders (admin only)
router.put('/:id/pay', authenticate, isAdmin, updateOrderToPaid); // Mark order as paid (admin only)
router.put('/:id/deliver', authenticate, isAdmin, updateOrderToDelivered); // Mark order as delivered (admin only)

module.exports = router;
