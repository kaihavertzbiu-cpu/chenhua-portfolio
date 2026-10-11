import Meting from '@meting/core';
import { createMusicService } from '../../lib/music-service.mjs';

const handler = createMusicService({
  createClient: () => new Meting('netease'),
  secret: process.env.MUSIC_SIGNING_SECRET
});
export default handler;
export const config = { path: '/api/music' };
