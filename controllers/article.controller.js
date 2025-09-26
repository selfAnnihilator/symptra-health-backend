const Article = require('../models/article.model');
const Request = require('../models/request.model');

// Get all published articles
exports.getPublishedArticles = async (req, res, next) => {
  try {
    const articles = await Article.find({ status: 'published' })
      .populate('author', 'name email');
    
    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    next(error);
  }
};

// Get article by ID
exports.getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'name email');
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // If article is not published, only allow author or admin to view
    if (article.status !== 'published') {
      if (!req.user || (req.user.id !== article.author._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
};

// Get all articles (admin only)
exports.getAllArticles = async (req, res, next) => {
  try {
    const articles = await Article.find()
      .populate('author', 'name email');
    
    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    next(error);
  }
};

// Create article
exports.createArticle = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body;
    
    const article = new Article({
      title,
      content,
      category,
      tags,
      author: req.user.id,
      status: 'draft'
    });
    
    await article.save();
    
    res.status(201).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
};

// Update article
exports.updateArticle = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body;
    
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // Check if user is author or admin
    if (article.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this article'
      });
    }
    
    // Only allow updates if the article is in draft or rejected status (unless admin)
    if (['pending', 'published'].includes(article.status) && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `Cannot update article in ${article.status} status`
      });
    }
    
    article.title = title;
    article.content = content;
    article.category = category;
    article.tags = tags;
    
    // If admin is updating, keep the current status, otherwise set to draft
    if (req.user.role !== 'admin') {
      article.status = 'draft';
    }
    
    await article.save();
    
    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
};

// Delete article
exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    await Article.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Submit article for approval
exports.submitForApproval = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // Check if user is the author
    if (article.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this article'
      });
    }
    
    // Check if article is in draft or rejected status
    if (!['draft', 'rejected'].includes(article.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit article in ${article.status} status`
      });
    }
    
    article.status = 'pending';
    await article.save();
    
    // Create approval request
    const request = new Request({
      type: 'article_approval',
      data: {
        articleId: article._id,
        title: article.title
      },
      submittedBy: req.user.id
    });
    
    await request.save();
    
    res.status(200).json({
      success: true,
      data: article,
      message: 'Article submitted for approval'
    });
  } catch (error) {
    next(error);
  }
};

// Review article (admin only)
exports.reviewArticle = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }
    
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    if (article.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only review pending articles'
      });
    }
    
    // Update article status
    article.status = status === 'approved' ? 'published' : 'rejected';
    await article.save();
    
    // Update any pending requests
    await Request.updateMany(
      { 
        'type': 'article_approval', 
        'data.articleId': article._id,
        'status': 'pending'
      },
      {
        $set: {
          status: status,
          reviewedBy: req.user.id,
          reviewNotes: reviewNotes || ''
        }
      }
    );
    
    res.status(200).json({
      success: true,
      data: article,
      message: `Article ${status}`
    });
  } catch (error) {
    next(error);
  }
};
