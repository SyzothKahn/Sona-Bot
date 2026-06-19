The broken hostname line is still in there. That's not the Spotify issue but fix it while you're in the file anyway.

More importantly, the real Spotify problem is that `spotify.link` short links need to be resolved to a full `open.spotify.com` URL before Odesli can process them, and the regex is catching both formats but the code only knows how to extract a track ID from `open.spotify.com` links.

Paste this entire replacement into GitHub, it fixes both issues:

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const MUSIC_URL_REGEX =
  /https?:\/\/(open\.spotify\.com\/[^\s]+|spotify\.link\/[^\s]+|(?:www\.)?youtube\.com\/watch\?[^\s]*v=[^\s]+|youtu\.be\/[^\s]+|music\.youtube\.com\/[^\s]+)/gi;

const PLATFORM_ORDER = [
  { key: 'youtube',      label: 'YOUTUBE' },
  { key: 'youtubeMusic', label: 'YOUTUBE MUSIC' },
  { key: 'spotify',      label: 'SPOTIFY' },
  { key: 'appleMusic',   label: 'APPLE MUSIC' },
  { key: 'tidal',        label: 'TIDAL' },
  { key: 'amazonMusic',  label: 'AMAZON MUSIC' },
];

function cleanUrl(url) {
  const parsed = new URL(url);
  if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com') {
    const v = parsed.searchParams.get('v');
    parsed.search = '';
    if (v) parsed.searchParams.set('v', v);
  } else {
    parsed.search = '';
  }
  return parsed.toString();
}

function extractSpotifyTrackId(url) {
  const match = url.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

async function resolveSpotifyShortLink(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return res.url;
  } catch {
    return url;
  }
}

async function fetchOdesli(url) {
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&userCountry=US&skipCache=true`;
  console.log('Sending to Odesli:', url);
  const res = await fetch(apiUrl);
  if (!res.ok) return null;
  const data = await res.json();
  return data.linksByPlatform ? data : null;
}

async function getOdesliData(url) {
  let resolved = url;

  if (url.includes('spotify.link')) {
    resolved = await resolveSpotifyShortLink(url);
    console.log('Resolved short link to:', resolved);
  }

  const clean = cleanUrl(resolved);
  console.log('Cleaned URL:', clean);

  let data = await fetchOdesli(clean);

  if (!data && clean.includes('open.spotify.com')) {
    const trackId = extractSpotifyTrackId(clean);
    if (trackId) {
      const bare = `https://open.spotify.com/track/${trackId}`;
      console.log('Retrying with bare Spotify URL:', bare);
      data = await fetchOdesli(bare);
    }
  }

  if (!data) return null;

  const entity = data.entitiesByUniqueId?.[data.entityUniqueId];
  return {
    links: data.linksByPlatform,
    artist: entity?.artistName ?? null,
    title: entity?.title ?? null,
  };
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const urls = [...(message.content.matchAll(MUSIC_URL_REGEX) ?? [])].map((m) => m[0]);
  if (urls.length === 0) return;
  const url = urls[0];
  let data;
  try {
    data = await getOdesliData(url);
  } catch {
    return;
  }
  if (!data) return;
  const { links, artist, title } = data;
  const lines = PLATFORM_ORDER
    .filter(({ key }) => links[key])
    .map(({ key, label }) => `${label}: <${links[key].url}>`);
  if (lines.length === 0) return;
  const header = artist && title ? `**${artist} - ${title}**\n` : '';
  await message.reply(`${header}${lines.join('\n')}`);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end('ok')).listen(PORT, () => {
  console.log(`Keep-alive server listening on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
```
