const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  type: {
    type: String,
    // ADDED 'contact_us_inquiry' here
    enum: ['article_approval', 'product_approval', 'user_registration', 'appointment_booking', 'free_consultation', 'contact_us_inquiry'], 
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for various request data
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'], // Default status for contact inquiries can be 'pending'
    default: 'pending',
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Make submittedBy optional for public requests (like contact form if not logged in)
    // If you want unauthenticated users to submit, make it not required.
    // For now, let's make it optional, and set it if user is logged in.
    required: false, // CHANGED TO FALSE to allow unauthenticated submissions
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewNotes: {
    type: String,
  },
}, { timestamps: true });

// Check if the model already exists before compiling it
const Request = mongoose.models.Request || mongoose.model('Request', requestSchema);

module.exports = Request;