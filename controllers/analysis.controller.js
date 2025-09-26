const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const MedicalReport = require('../models/medicalReport.model');

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// @desc Analyze medical report from uploaded file or pasted text
// @route POST /api/analysis/report
// @access Private
exports.analyzeReportFromFile = async (req, res, next) => {
  try {
    if (!req.file && !req.body.reportText) {
      return res.status(400).json({ success: false, message: 'No file or text provided.' });
    }

    let reportText = '';
    let originalFileName = req.file ? req.file.originalname : 'Pasted Text';

    if (req.file) {
      const mime = req.file.mimetype;
      const buffer = req.file.buffer;

      if (mime === 'application/pdf') {
        const data = await pdf(buffer);
        reportText = data.text;
      } else if (mime === 'text/plain') {
        reportText = buffer.toString('utf8');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Only PDF and plain text files are supported in this mode.',
        });
      }
    } else if (req.body.reportText) {
      reportText = req.body.reportText;
    }

    if (reportText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Extracted text is empty.' });
    }

    const userPrompt = `As a medical report analyzer, summarize the key findings, potential implications, and suggest any necessary follow-up actions based on the following medical report text. Emphasize that this is not a medical diagnosis and should not replace professional medical advice.

Medical Report: "${reportText}"

Summary of Findings:
Potential Implications:
Suggested Follow-up:`;

    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 1000 },
    });

    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const aiAnalysisText = response.text();

    const newMedicalReport = new MedicalReport({
      user: req.user.id,
      reportTextSnippet: reportText.substring(0, 500) + (reportText.length > 500 ? '...' : ''),
      aiAnalysis: aiAnalysisText,
      originalFileName,
      analysisTimestamp: new Date(),
    });

    await newMedicalReport.save();

    res.status(200).json({
      success: true,
      message: 'Report analyzed successfully.',
      data: {
        reportText: newMedicalReport.reportTextSnippet,
        analysis: newMedicalReport.aiAnalysis,
        timestamp: newMedicalReport.analysisTimestamp.toLocaleString(),
        _id: newMedicalReport._id,
      },
    });
  } catch (error) {
    console.error('Error analyzing report:', error);
    next(error);
  }
};

// @desc Get reports
exports.getMyMedicalReports = async (req, res, next) => {
  try {
    const reports = await MedicalReport.find({ user: req.user.id }).sort({ analysisTimestamp: -1 });
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    next(error);
  }
};

// @desc Delete report
exports.deleteMedicalReport = async (req, res, next) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    if (!report || (report.user.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized or not found.' });
    }
    await report.deleteOne();
    res.status(200).json({ success: true, message: 'Deleted successfully.' });
  } catch (error) {
    console.error('Error deleting report:', error);
    next(error);
  }
};


