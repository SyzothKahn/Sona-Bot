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

// Strip all tracking params before sending to Odesli.
// youtube.com/watch needs the 'v' param to identify the video — keep only that.
// Every other URL gets all query params removed entirely.
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

async function fetchOdesli(url, isSpotify = false) {
  const extra = isSpotify ? '&skipCache=true' : '';
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&userCountry=US${extra}`;
  console.log('Sending to Odesli:', url);
  const res = await fetch(apiUrl);
  if (!res.ok) return null;
  const data = await res.json();
  return data.linksByPlatform ? data : null;
}

async function getOdesliData(url) {
  const clean = cleanUrl(url);
  const isSpotify = clean.includes('open.spotify.com');

  let data = await fetchOdesli(clean, isSpotify);

  // If Spotify failed, retry with a bare reconstructed track URL
  if (!data && isSpotify) {
    const trackId = extractSpotifyTrackId(clean);
    if (trackId) {
      const bare = `https://open.spotify.com/track/${trackId}`;
      console.log('Retrying Odesli with bare Spotify URL:', bare);
      data = await fetchOdesli(bare, true);
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

// Keep-alive HTTP server so Railway doesn't SIGTERM the process
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end('ok')).listen(PORT, () => {
  console.log(`Keep-alive server listening on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
