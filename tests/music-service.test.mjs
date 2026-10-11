import test from 'node:test';
import assert from 'node:assert/strict';
import { createMusicService } from '../lib/music-service.mjs';

const secret = 'a-local-test-key-only-not-a-production-secret';
const rows = [{ name: 'Local Test', artist: ['Fixture'], url_id: '101', lyric_id: '101', pic_id: '202' }];
const req = path => new Request('https://fixture.example' + path);
function setup(overrides = {}, options = {}) {
  const calls = [];
  const fake = { format() {}, playlist: async () => JSON.stringify(rows), url: async () => JSON.stringify({ url: 'http://m7.music.126.net/fixture.mp3' }), pic: async () => JSON.stringify({ url: 'https://p3.music.126.net/fixture.jpg' }), lyric: async () => JSON.stringify({ lyric: '[00:00.00] Synthetic test only' }), ...overrides };
  const createClient = () => new Proxy(fake, { get(target, key) { return (...args) => { if (key !== 'format') calls.push([key, ...args]); return target[key](...args); }; } });
  return { handle: createMusicService({ createClient, secret, ...options }), calls };
}
async function tracks(handle) { return (await handle(req('/api/music?server=netease&type=playlist&id=12903419329'))).json(); }

test('health and invalid input never contact upstream', async () => {
  const { handle, calls } = setup();
  assert.equal((await handle(req('/api/music?type=health'))).status, 200);
  assert.equal((await handle(req('/api/music?server=tencent&type=playlist&id=12903419329'))).status, 400);
  assert.equal((await handle(req('/api/music?server=netease&type=playlist&id=999'))).status, 400);
  assert.equal((await handle(req('/api/music?server=netease&type=url&id=101'))).status, 403);
  assert.equal((await handle(new Request('https://fixture.example/api/music', { method: 'POST' }))).status, 405);
  assert.equal(calls.length, 0);
});
test('missing signing secret fails closed', async () => {
  const { handle, calls } = setup({}, { secret: undefined });
  assert.equal((await handle(req('/api/music?type=health'))).status, 503);
  assert.equal((await handle(req('/api/music?server=netease&type=playlist&id=12903419329'))).status, 503);
  assert.equal(calls.length, 0);
});
test('playlist cached and concurrent metadata reads coalesced', async () => {
  const { handle, calls } = setup();
  const [a, b] = await Promise.all([tracks(handle), tracks(handle)]);
  assert.deepEqual(a, b);
  assert.equal(a[0].artist, 'Fixture');
  assert.equal(calls.filter(c => c[0] === 'playlist').length, 1);
  assert.ok(a[0].url.startsWith('/api/music?'));
  assert.ok(!JSON.stringify(a).includes(secret));
});
test('fresh audio resolution, HTTPS redirect, picture and lyrics', async () => {
  const { handle, calls } = setup();
  const [song] = await tracks(handle);
  const audio = await handle(req(song.url));
  assert.equal(audio.status, 302);
  assert.equal(audio.headers.get('location'), 'https://m7.music.126.net/fixture.mp3');
  assert.equal(audio.headers.get('cache-control'), 'no-store');
  assert.equal((await handle(req(song.pic))).status, 302);
  assert.match(await (await handle(req(song.lrc))).text(), /Synthetic test/);
  await handle(req(song.url));
  assert.equal(calls.filter(c => c[0] === 'url').length, 2);
});
test('tampered song, type and expired links rejected before upstream', async () => {
  let clock = 1780000000000;
  const { handle, calls } = setup({}, { now: () => clock });
  const [song] = await tracks(handle);
  assert.equal((await handle(req(song.url.replace('id=101', 'id=102')))).status, 403);
  assert.equal((await handle(req(song.url.replace('type=url', 'type=pic')))).status, 403);
  clock += 86400001;
  assert.equal((await handle(req(song.url))).status, 403);
  assert.equal(calls.length, 1);
});
test('empty media is explicit 404 and unexpected hosts are rejected', async () => {
  for (const [url, status] of [['', 404], ['https://example.com/private', 502], ['https://music.126.net.evil.example/a', 502], ['https://user:pass@m7.music.126.net/a', 502]]) {
    const { handle } = setup({ url: async () => JSON.stringify({ url }) });
    const [song] = await tracks(handle);
    assert.equal((await handle(req(song.url))).status, status);
  }
});
test('upstream failure sanitized, timeout bounded, retry not poisoned', async () => {
  let failed = true;
  const { handle } = setup({ playlist: async () => { if (failed) throw new Error('sensitive upstream exception'); return JSON.stringify(rows); } });
  const response = await handle(req('/api/music?server=netease&type=playlist&id=12903419329'));
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('sensitive'));
  failed = false;
  assert.equal((await tracks(handle)).length, 1);
  const slow = setup({ playlist: () => new Promise(() => {}) }, { timeoutMs: 10 });
  assert.equal((await slow.handle(req('/api/music?server=netease&type=playlist&id=12903419329'))).status, 504);
});
