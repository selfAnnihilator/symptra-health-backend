const assert = require('node:assert/strict');
const test = require('node:test');
const { createGeminiService } = require('../services/gemini.service');

test('rejects requests when GEMINI_API_KEY is missing', async () => {
  const service = createGeminiService({ apiKey: '' });

  await assert.rejects(
    service.generateText('test'),
    (error) => error.statusCode === 503 && error.message === 'AI service is not configured.',
  );
});

test('does not expose provider details for an invalid API key', async () => {
  class InvalidKeyClient {
    getGenerativeModel() {
      return {
        generateContent: async () => {
          throw new Error('API_KEY_INVALID: API key not valid');
        },
      };
    }
  }

  const service = createGeminiService({
    apiKey: 'placeholder',
    GoogleGenerativeAIClass: InvalidKeyClient,
  });

  await assert.rejects(
    service.generateText('test'),
    (error) => error.statusCode === 503
      && error.message === 'AI service is not configured with a valid API key.'
      && !error.message.includes('API_KEY_INVALID'),
  );
});
