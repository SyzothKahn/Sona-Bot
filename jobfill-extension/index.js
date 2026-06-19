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

// Strip tracking params from Spotify URLs so Odesli doesn't bail on opt-out signals
function cleanUrl(url) {
  const parsed = new URL(url);
  if (parsed.hostname === 'open.spotify.com') {
    // Keep only the clean path (e.g. /track/TRACKID), drop all query params
    return `${parsed.origin}${parsed.pathname}`;
  }
  return url;
}

async function getOdesliData(url) {
  const clean = cleanUrl(url);
  console.log('Sending to Odesli:', clean);
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(clean)}&userCountry=US`;
  const res = await fetch(apiUrl);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.linksByPlatform) return null;
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
