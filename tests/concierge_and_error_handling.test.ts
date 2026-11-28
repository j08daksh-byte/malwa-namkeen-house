import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import conciergeRoutes, { getGeminiConfig } from '../server/routes/concierge.ts';
import { apiNotFoundHandler, apiErrorHandler } from '../server/lib/errorHandler.ts';

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json({ limit: '1kb' }));
  app.use('/api/concierge', conciergeRoutes);
  app.get('/api/cast-error', () => {
    const err = new Error('Cast failed');
    err.name = 'CastError';
    throw err;
  });
  app.use('/api', apiNotFoundHandler);
  app.use(apiErrorHandler);

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe('Concierge Gemini Config & API Error Handling', () => {
  it('treats blank or placeholder GEMINI_API_KEY as unconfigured', () => {
    const prevKey = process.env.GEMINI_API_KEY;
    const prevModel = process.env.GEMINI_MODEL;
    try {
      process.env.GEMINI_API_KEY = 'your-gemini-api-key';
      delete process.env.GEMINI_MODEL;
      const cfg = getGeminiConfig();
      assert.equal(cfg.configured, false);
      assert.equal(cfg.apiKey, '');
      assert.equal(cfg.model, 'gemini-3.8-flash');
    } finally {
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
      if (prevModel === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = prevModel;
    }
  });

  it('serves JSON 404 for unknown /api routes and JSON 400 for malformed JSON or CastError', async () => {
    await withServer(async baseUrl => {
      const notFoundRes = await fetch(`${baseUrl}/api/does-not-exist`);
      assert.equal(notFoundRes.status, 404);
      const notFoundJson = await notFoundRes.json();
      assert.equal(notFoundJson.success, false);

      const badJsonRes = await fetch(`${baseUrl}/api/concierge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      });
      assert.equal(badJsonRes.status, 400);
      const badJson = await badJsonRes.json();
      assert.equal(badJson.success, false);

      const castRes = await fetch(`${baseUrl}/api/cast-error`);
      assert.equal(castRes.status, 400);
      const castJson = await castRes.json();
      assert.equal(castJson.success, false);
    });
  });

  it('rejects null/malformed messages elements cleanly with 400 and falls back smoothly when unconfigured', async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'your-gemini-api-key';
    try {
      await withServer(async baseUrl => {
        const nullMsgRes = await fetch(`${baseUrl}/api/concierge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [null] }),
        });
        assert.equal(nullMsgRes.status, 400);

        const okRes = await fetch(`${baseUrl}/api/concierge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ sender: 'user', text: 'Recommend Ratlami Sev' }] }),
        });
        assert.equal(okRes.status, 200);
        const okJson = await okRes.json();
        assert.match(okJson.text, /Malwa|Ratlami/i);

        const statusRes = await fetch(`${baseUrl}/api/concierge/status`);
        assert.equal(statusRes.status, 200);
        const statusJson = await statusRes.json();
        assert.equal(statusJson.configured, false);
      });
    } finally {
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
    }
  });
});
