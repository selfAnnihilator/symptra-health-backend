
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// Get all products
router.get('/', productController.getAllProducts);

// Get single product
router.get('/:id', productController.getProductById);

// Create product (admin only)
router.post('/', authenticate, isAdmin, productController.createProduct);

// Update product (admin only)
router.put('/:id', authenticate, isAdmin, productController.updateProduct);

// Delete product (admin only)
router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);

module.exports = router;
