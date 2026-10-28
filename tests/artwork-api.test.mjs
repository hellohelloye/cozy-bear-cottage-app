// Focused tests for api/artwork.js — run with `npm test`
// (Node built-in runner). Resend calls are stubbed via global fetch;
// no network, no real key.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.RESEND_API_KEY = 'test-resend-key';
const { default: handler } = await import('../api/artwork.js');

function mockRes() {
  return {
    code: 0, body: null,
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; }
  };
}

function stubFetch(impl) {
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body) });
    const data = impl(url, JSON.parse(opts.body));
    return { ok: true, status: 200, json: async () => data };
  };
  return calls;
}

const TINY = 'data:image/jpeg;base64,/9j/tiny';

test('artwork emails image attachment with artist name and title', async () => {
  const calls = stubFetch((url) => {
    assert.equal(url, 'https://api.resend.com/emails');
    return { id: 'email-123' };
  });
  const r = mockRes();
  await handler(
    { method: 'POST', body: { image: TINY, name: ' Vivian ', title: ' Rainbow Apple ' } },
    r
  );
  assert.equal(r.code, 200);
  assert.equal(r.body.id, 'email-123');
  assert.equal(calls.length, 1);
  const sent = calls[0].body;
  assert.equal(sent.to, 'applebearscabinet26@gmail.com');
  assert.ok(sent.subject.includes('Rainbow Apple'));
  assert.ok(sent.subject.includes('Vivian'));
  assert.ok(sent.text.includes('Vivian'));
  assert.ok(sent.text.includes('Rainbow Apple'));
  assert.equal(sent.attachments.length, 1);
  assert.equal(sent.attachments[0].content, '/9j/tiny');
  assert.ok(sent.attachments[0].filename.endsWith('.jpg'));
});

test('artwork rejects non-image payloads and GET', async () => {
  const bad = mockRes();
  await handler({ method: 'POST', body: { image: 'data:text/html;base64,PGI+', name: 'x', title: 'y' } }, bad);
  assert.equal(bad.code, 400);

  const get = mockRes();
  await handler({ method: 'GET', body: {} }, get);
  assert.equal(get.code, 405);
});

test('artwork rejects oversized images before calling Resend', async () => {
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('must not be called'); };
  const r = mockRes();
  const huge = 'data:image/png;base64,' + 'A'.repeat(6 * 1024 * 1024);
  await handler({ method: 'POST', body: { image: huge, name: 'x', title: 'y' } }, r);
  assert.equal(r.code, 400);
  assert.equal(called, false);
});
