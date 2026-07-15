const { generateText } = require('../services/gemini.service');

const MAX_MESSAGES = 20;
const MAX_TOTAL_CHARACTERS = 20000;

const validateContents = (contents) => {
  if (!Array.isArray(contents) || contents.length === 0 || contents.length > MAX_MESSAGES) {
    return false;
  }

  let totalCharacters = 0;
  const isValid = contents.every((message) => {
    if (!['user', 'model'].includes(message?.role) || !Array.isArray(message.parts) || message.parts.length === 0) {
      return false;
    }

    return message.parts.every((part) => {
      if (typeof part?.text !== 'string' || part.text.trim().length === 0) {
        return false;
      }
      totalCharacters += part.text.length;
      return totalCharacters <= MAX_TOTAL_CHARACTERS;
    });
  });

  return isValid;
};

exports.generateContent = async (req, res, next) => {
  try {
    const { contents } = req.body;

    if (!validateContents(contents)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid AI request.',
      });
    }

    const text = await generateText(contents);
    return res.status(200).json({ success: true, data: { text } });
  } catch (error) {
    next(error);
  }
};

exports.validateContents = validateContents;
