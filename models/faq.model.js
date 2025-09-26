const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  // You can add a category or order for sorting
  category: {
    type: String,
    default: 'General',
  },
}, {
  timestamps: true,
});

const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', faqSchema);

module.exports = FAQ;
