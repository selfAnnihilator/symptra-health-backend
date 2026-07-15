const { GoogleGenerativeAI } = require('@google/generative-ai');

const createServiceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toPublicGeminiError = (error) => {
  const providerMessage = error?.message || '';

  if (/API_KEY_INVALID|API key not valid|API key expired/i.test(providerMessage)) {
    return createServiceError('AI service is not configured with a valid API key.', 503);
  }

  if (/\b429\b|RESOURCE_EXHAUSTED|quota exceeded/i.test(providerMessage)) {
    return createServiceError('AI service quota exceeded. Please try again later.', 429);
  }

  return createServiceError('AI service is temporarily unavailable. Please try again later.', 502);
};

const createGeminiService = ({
  apiKey = process.env.GEMINI_API_KEY,
  modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  GoogleGenerativeAIClass = GoogleGenerativeAI,
} = {}) => ({
  async generateText(contents) {
    if (!apiKey) {
      throw createServiceError('AI service is not configured.', 503);
    }

    try {
      const genAI = new GoogleGenerativeAIClass(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const request = typeof contents === 'string'
        ? contents
        : { contents, generationConfig: { maxOutputTokens: 1000 } };
      const result = await model.generateContent(request);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      return text;
    } catch (error) {
      console.error('Gemini provider error:', error?.message || error);
      throw toPublicGeminiError(error);
    }
  },
});

const generateText = (contents) => createGeminiService().generateText(contents);

module.exports = {
  createGeminiService,
  generateText,
  toPublicGeminiError,
};
