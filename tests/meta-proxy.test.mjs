// Focused regression tests for api/meta.js — run with `npm test`
// (Node built-in runner, no extra framework). Upstream Meta calls are
// stubbed via global fetch; no network, no real key.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.META_API_KEY = 'test-key';
const { default: handler } = await import('../api/meta.js');

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

const TINY_IMAGE = 'data:image/jpeg;base64,/9j/tiny';

test('segment names the tapped object via Spark vision when SAM text is empty', async () => {
  stubFetch((url, body) => {
    if (url.endsWith('/responses')) {
      // SAM today: accepts image+point, returns empty output_text.
      return { output: [{ content: [{ type: 'output_text', text: '' }] }] };
    }
    if (url.endsWith('/chat/completions')) {
      const parts = body.messages[0].content;
      assert.ok(Array.isArray(parts), 'vision naming must send image parts');
      assert.ok(parts.some((p) => p.type === 'image_url'), 'vision naming must include the photo');
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              zh: '苹果', pinyin: 'píng guǒ', en: 'apple',
              box: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 }
            })
          }
        }]
      };
    }
    throw new Error(`unexpected upstream ${url}`);
  });

  const r = mockRes();
  await handler(
    { method: 'POST', body: { kind: 'segment', payload: { image: TINY_IMAGE, point: { x: 0.5, y: 0.5 } } } },
    r
  );
  assert.equal(r.code, 200);
  assert.equal(r.body.zh, '苹果');
  assert.equal(r.body.en, 'apple');
  assert.deepEqual(r.body.box, { x: 0.1, y: 0.1, width: 0.5, height: 0.5 });
});

test('segment rejects out-of-range tap points', async () => {
  const r = mockRes();
  await handler(
    { method: 'POST', body: { kind: 'segment', payload: { image: TINY_IMAGE, point: { x: 2, y: 0 } } } },
    r
  );
  assert.equal(r.code, 400);
});

test('lesson parses Spark JSON content into lesson shape', async () => {
  stubFetch((url) => {
    assert.ok(url.endsWith('/chat/completions'));
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            theme: 'Colors', words: [{ zh: '红色', pinyin: 'hóng sè', en: 'red', emoji: '🟥' }]
          })
        }
      }]
    };
  });
  const r = mockRes();
  await handler(
    { method: 'POST', body: { kind: 'lesson', payload: { theme: 'Colors', ageRange: '3-6' } } },
    r
  );
  assert.equal(r.code, 200);
  assert.equal(r.body.words[0].zh, '红色');
});
