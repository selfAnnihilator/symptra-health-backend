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

test('uses the configured supported Gemini model', async () => {
  let selectedModel;

  class CapturingClient {
    getGenerativeModel(config) {
      selectedModel = config.model;
      return {
        generateContent: async () => ({
          response: { text: () => 'analysis complete' },
        }),
      };
    }
  }

  const service = createGeminiService({
    apiKey: 'placeholder',
    modelName: 'gemini-3.5-flash',
    GoogleGenerativeAIClass: CapturingClient,
  });

  assert.equal(await service.generateText('test'), 'analysis complete');
  assert.equal(selectedModel, 'gemini-3.5-flash');
});

test('returns a clear public error when Gemini quota is exhausted', async () => {
  class QuotaLimitedClient {
    getGenerativeModel() {
      return {
        generateContent: async () => {
          throw new Error('[429] RESOURCE_EXHAUSTED: quota exceeded');
        },
      };
    }
  }

  const service = createGeminiService({
    apiKey: 'placeholder',
    modelName: 'gemini-3.5-flash',
    GoogleGenerativeAIClass: QuotaLimitedClient,
  });

  await assert.rejects(
    service.generateText('test'),
    (error) => error.statusCode === 429
      && error.message === 'AI service quota exceeded. Please try again later.',
  );
});
