const express = require('express');
const { generateContent } = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/generate', authenticate, generateContent);

module.exports = router;
