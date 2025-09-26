
const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// Get all published articles
router.get('/', articleController.getPublishedArticles);

// Get article by ID
router.get('/:id', articleController.getArticleById);

// Get all articles (including drafts and pending) - admin only
router.get('/admin/all', authenticate, isAdmin, articleController.getAllArticles);

// Create article (authenticated)
router.post('/', authenticate, articleController.createArticle);

// Update article (author or admin)
router.put('/:id', authenticate, articleController.updateArticle);

// Delete article (admin only)
router.delete('/:id', authenticate, isAdmin, articleController.deleteArticle);

// Submit article for approval
router.post('/:id/submit', authenticate, articleController.submitForApproval);

// Approve/reject article (admin only)
router.put('/:id/review', authenticate, isAdmin, articleController.reviewArticle);

module.exports = router;
