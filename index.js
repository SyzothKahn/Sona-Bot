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

const PLATFORM_LABELS = {
  spotify: 'Spotify',
  youtubeMusic: 'YouTube Music',
  youtube: 'YouTube',
  appleMusic: 'Apple Music',
  tidal: 'Tidal',
  amazonMusic: 'Amazon Music',
  deezer: 'Deezer',
  pandora: 'Pandora',
  soundcloud: 'SoundCloud',
};

function detectSourcePlatform(url) {
  if (/spotify\.com|spotify\.link/i.test(url)) return 'spotify';
  if (/music\.youtube\.com/i.test(url)) return 'youtubeMusic';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  return null;
}

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
  const source = detectSourcePlatform(url);

  let links;
  try {
    links = await getOdesliLinks(url);
  } catch {
    return; // silent failure
  }
  if (!links) return;

  const lines = Object.entries(links)
    .filter(([platform]) => platform !== source && PLATFORM_LABELS[platform])
    .map(([platform, { url: platformUrl }]) => `**${PLATFORM_LABELS[platform]}**: ${platformUrl}`);

  if (lines.length === 0) return;

  await message.reply(lines.join('\n'));
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
