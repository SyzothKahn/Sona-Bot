require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const MUSIC_URL_REGEX =
  /https?:\/\/(open\.spotify\.com\/(track|album|playlist)\/[^\s]+|spotify\.link\/[^\s]+|(?:www\.)?youtube\.com\/watch\?[^\s]*v=[^\s]+|youtu\.be\/[^\s]+|music\.youtube\.com\/[^\s]+)/gi;

const PLATFORM_ORDER = [
  { key: 'youtube',      label: 'YOUTUBE' },
  { key: 'youtubeMusic', label: 'YOUTUBE MUSIC' },
  { key: 'spotify',      label: 'SPOTIFY' },
  { key: 'appleMusic',   label: 'APPLE MUSIC' },
  { key: 'tidal',        label: 'TIDAL' },
  { key: 'amazonMusic',  label: 'AMAZON MUSIC' },
];

async function getOdesliLinks(url) {
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) return null;
  const data = await res.json();
  return data.linksByPlatform ?? null;
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const urls = [...(message.content.matchAll(MUSIC_URL_REGEX) ?? [])].map((m) => m[0]);
  if (urls.length === 0) return;

  // Process only the first detected music URL
  const url = urls[0];
  let links;
  try {
    links = await getOdesliLinks(url);
  } catch {
    return; // silent failure
  }
  if (!links) return;

  const lines = PLATFORM_ORDER
    .filter(({ key }) => links[key])
    .map(({ key, label }) => `${label}: ${links[key].url}`);

  if (lines.length === 0) return;

  await message.reply(lines.join('\n'));
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
