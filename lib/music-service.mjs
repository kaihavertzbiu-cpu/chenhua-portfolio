import { createHmac, timingSafeEqual } from 'node:crypto';

const PLAYLIST = '12903419329';
const ID = /^\d{1,24}$/;
const TYPES = new Set(['url', 'pic', 'lrc']);
const parse = value => typeof value === 'string' ? JSON.parse(value) : value;
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});

// Only redirect to the provider's media hosts; never accept visitor-supplied URLs.
function mediaURL(value) {
  try {
    const u = new URL(value);
    if (u.hostname !== 'music.126.net' && !u.hostname.endsWith('.music.126.net')) return '';
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.port) return '';
    u.protocol = 'https:';
    return u.href;
  } catch { return ''; }
}

export function createMusicService({ createClient, secret, now = Date.now, timeoutMs = 8000 }) {
  let cached = null;
  let pending = null;
  const configured = typeof secret === 'string' && secret.length >= 32;
  const sign = (type, id, expires) => createHmac('sha256', secret).update(`${PLAYLIST}:${type}:${id}:${expires}`).digest('hex');
  function link(type, id, expires) {
    return '/api/music?' + new URLSearchParams({ server: 'netease', type, id, expires: String(expires), auth: sign(type, id, expires) });
  }
  function authorized(q) {
    const type = q.get('type'), id = q.get('id') || '', expires = q.get('expires') || '', auth = q.get('auth') || '';
    if (!TYPES.has(type) || !ID.test(id) || !/^\d{10}$/.test(expires) || !/^[a-f0-9]{64}$/.test(auth)) return false;
    const seconds = Math.floor(now() / 1000);
    if (Number(expires) <= seconds || Number(expires) > seconds + 86400) return false;
    return timingSafeEqual(Buffer.from(auth, 'hex'), Buffer.from(sign(type, id, expires), 'hex'));
  }
  async function call(method, ...args) {
    const client = createClient();
    client.format(true);
    let timer;
    try {
      return parse(await Promise.race([
        client[method](...args),
        new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { timedOut: true })), timeoutMs); })
      ]));
    } finally { clearTimeout(timer); }
  }
  async function playlist() {
    if (cached && cached.until > now()) return cached.tracks;
    if (pending) return pending;
    pending = (async () => {
      const rows = await call('playlist', PLAYLIST);
      if (!Array.isArray(rows) || !rows.length) throw new Error('empty playlist');
      const expires = Math.floor(now() / 1000) + 86400;
      const tracks = rows.filter(s => s && typeof s.name === 'string' && ID.test(String(s.url_id)) && ID.test(String(s.lyric_id))).slice(0, 1000).map(s => ({
        name: s.name,
        artist: Array.isArray(s.artist) ? s.artist.join(' / ') : String(s.artist || ''),
        url: link('url', String(s.url_id), expires),
        pic: ID.test(String(s.pic_id)) ? link('pic', String(s.pic_id), expires) : '',
        lrc: link('lrc', String(s.lyric_id), expires)
      }));
      if (!tracks.length) throw new Error('invalid playlist');
      cached = { until: now() + 60000, tracks };
      return tracks;
    })();
    try { return await pending; } finally { pending = null; }
  }

  return async request => {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    const q = new URL(request.url).searchParams;
    const type = q.get('type');
    // Health never contacts NetEase or reads a playlist.
    if (type === 'health') return json({ service: 'chenhua-music', configured }, configured ? 200 : 503);
    if (!configured) return json({ code: 'SERVICE_NOT_CONFIGURED' }, 503);
    if (q.get('server') !== 'netease') return json({ code: 'INVALID_PROVIDER' }, 400);
    if (type === 'playlist' ? q.get('id') !== PLAYLIST : !TYPES.has(type)) return json({ code: 'INVALID_RESOURCE' }, 400);
    if (type !== 'playlist' && !authorized(q)) return json({ code: 'INVALID_OR_EXPIRED_LINK' }, 403);
    try {
      if (type === 'playlist') return json(await playlist());
      const id = q.get('id');
      if (type === 'lrc') {
        const data = await call('lyric', id);
        return new Response(typeof data?.lyric === 'string' ? data.lyric : '', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
      }
      // Resolve at request time instead of storing an expiring audio URL in the playlist.
      const data = await call(type, id, type === 'pic' ? 300 : 320);
      if (!data?.url) return json({ code: 'SOURCE_UNAVAILABLE' }, 404);
      const target = mediaURL(data.url);
      if (!target) return json({ code: 'UNEXPECTED_MEDIA_HOST' }, 502);
      return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'no-store' } });
    } catch (error) {
      // Never send cookies, signed media addresses or raw upstream exceptions to visitors.
      return json({ code: error.timedOut ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_FAILED' }, error.timedOut ? 504 : 502);
    }
  };
}
