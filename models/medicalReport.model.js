const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportTextSnippet: { // Store a snippet of the original report text
    type: String,
    required: true,
  },
  aiAnalysis: { // Store the AI generated analysis
    type: String,
    required: true,
  },
  originalFileName: { // Store the name of the uploaded file
    type: String,
  },
  analysisTimestamp: { // When the analysis was performed
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const MedicalReport = mongoose.models.MedicalReport || mongoose.model('MedicalReport', medicalReportSchema);

module.exports = MedicalReport;
