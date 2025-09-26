const express = require('express');
const { getFAQs, createFAQ, updateFAQ, deleteFAQ } = require('../controllers/faq.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getFAQs); // Public route to get all FAQs
router.post('/', authenticate, isAdmin, createFAQ); // Admin route to create
router.put('/:id', authenticate, isAdmin, updateFAQ); // Admin route to update
router.delete('/:id', authenticate, isAdmin, deleteFAQ); // Admin route to delete

module.exports = router;
