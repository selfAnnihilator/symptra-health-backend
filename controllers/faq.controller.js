const FAQ = require('../models/faq.model');

// @desc    Get all FAQs (public access)
// @route   GET /api/faqs
// @access  Public
exports.getFAQs = async (req, res, next) => {
  try {
    const faqs = await FAQ.find({});
    res.status(200).json({ success: true, count: faqs.length, data: faqs });
  } catch (error) {
    console.error('Error getting FAQs:', error);
    next(error);
  }
};

// @desc    Create a new FAQ (Admin only)
// @route   POST /api/faqs
// @access  Private (Admin)
exports.createFAQ = async (req, res, next) => {
  try {
    const { question, answer, category } = req.body;
    const newFAQ = new FAQ({ question, answer, category });
    const savedFAQ = await newFAQ.save();
    res.status(201).json({ success: true, data: savedFAQ });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    next(error);
  }
};

// @desc    Update a FAQ (Admin only)
// @route   PUT /api/faqs/:id
// @access  Private (Admin)
exports.updateFAQ = async (req, res, next) => {
  try {
    const { question, answer, category } = req.body;
    const updatedFAQ = await FAQ.findByIdAndUpdate(req.params.id, { question, answer, category }, { new: true });
    res.status(200).json({ success: true, data: updatedFAQ });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    next(error);
  }
};

// @desc    Delete a FAQ (Admin only)
// @route   DELETE /api/faqs/:id
// @access  Private (Admin)
exports.deleteFAQ = async (req, res, next) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    next(error);
  }
};
