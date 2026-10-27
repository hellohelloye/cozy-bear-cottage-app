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

test('parseSamTokens normalizes SAM box and mask geometry', async () => {
  const { parseSamTokens } = await import('../api/meta.js');
  const text = '<25f>0<|box;x1=397;y1=194;x2=557;y2=347;w=960;h=540|><|mask;x=0;y=0;data=154,161,~abc123|>';
  const objects = parseSamTokens(text);
  assert.equal(objects.length, 1);
  assert.equal(objects[0].frame, 25);
  assert.ok(Math.abs(objects[0].box.x - 397 / 960) < 1e-9);
  assert.ok(Math.abs(objects[0].box.height - (347 - 194) / 540) < 1e-9);
  assert.equal(objects[0].mask.height, 154);
  assert.equal(objects[0].mask.width, 161);
  assert.deepEqual(parseSamTokens(''), []);
  assert.deepEqual(parseSamTokens('no tokens here'), []);
});

test('segment with video returns first SAM object box and mask', async () => {
  stubFetch((url, body) => {
    assert.ok(url.endsWith('/responses'));
    assert.equal(body.input[0].content[0].text, 'flower');
    return {
      output: [{
        content: [{
          type: 'output_text',
          text: '<0f>0<|box;x1=480;y1=270;x2=960;y2=540;w=960;h=540|><|mask;x=1;y=2;c=0.9;data=10,20,~zz|>'
        }]
      }]
    };
  });
  const r = mockRes();
  await handler(
    { method: 'POST', body: { kind: 'segment', payload: { video: 'data:video/mp4;base64,xx', concept: 'flower' } } },
    r
  );
  assert.equal(r.code, 200);
  assert.deepEqual(r.body.box, { x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
  assert.equal(r.body.mask.confidence, 0.9);
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
