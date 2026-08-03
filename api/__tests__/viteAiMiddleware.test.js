import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';

import { createAiDevMiddleware } from '../viteAiMiddleware';

describe('Vite AI middleware', () => {
  it('adapts POST /api/ai to the Vercel function contract', async () => {
    const request = Readable.from([JSON.stringify({ operation: 'chat' })]);
    request.method = 'POST';
    request.url = '/api/ai';
    request.headers = { authorization: 'Bearer token' };
    const response = {
      statusCode: 200,
      headers: {},
      setHeader: vi.fn((name, value) => { response.headers[name] = value; }),
      end: vi.fn(),
    };
    const handler = vi.fn(async (req, res) => {
      expect(req.body).toBe('{"operation":"chat"}');
      res.status(201).json({ ok: true });
    });

    await createAiDevMiddleware(handler)(request, response, vi.fn());

    expect(response.statusCode).toBe(201);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(response.end).toHaveBeenCalledWith('{"ok":true}');
  });

  it('passes unrelated requests to Vite', async () => {
    const next = vi.fn();
    const handler = vi.fn();
    await createAiDevMiddleware(handler)({ url: '/src/main.jsx' }, {}, next);
    expect(next).toHaveBeenCalledOnce();
    expect(handler).not.toHaveBeenCalled();
  });
});
