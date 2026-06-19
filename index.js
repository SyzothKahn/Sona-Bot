require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// Start HTTP server first so Railway's healthcheck passes immediately
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
}).listen(PORT, () => {
  console.log(`Keep-alive server listening on port ${PORT}`);
});

// Explicitly ignore SIGTERM — Railway sends this to kill the process but we stay alive
process.on('SIGTERM', () => {});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const recentlySentMessages = new Set();

const MUSIC_URL_REGEX =
  /https?:\/\/(open\.spotify\.com\/[^\s]+|spotify\.link\/[^\s]+|(?:www\.)?youtube\.com\/watch\?[^\s]*v=[^\s]+|youtu\.be\/[^\s]+|music\.youtube\.com\/[^\s]+)/gi;

const PLATFORM_ORDER = [
  { key: 'youtube',      label: 'YOUTUBE' },
  { key: 'youtubeMusic', label: 'YOUTUBE MUSIC' },
  { key: 'spotify',      label: 'SPOTIFY' },
  { key: 'appleMusic',   label: 'APPLE MUSIC' },
];

// youtube.com/watch needs 'v' to identify the video — keep only that, drop everything else.
// All other URLs get every query param stripped.
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

function youtubeSearchUrl(artist, title) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`;
}

function youtubeMusicSearchUrl(artist, title) {
  return `https://music.youtube.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
}

function spotifySearchUrl(artist, title) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${artist} ${title}`)}`;
}

// --- Spotify Client Credentials ---

let spotifyToken = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;

  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    console.log('Spotify token request failed:', res.status);
    return null;
  }

  const data = await res.json();
  spotifyToken = data.access_token;
  spotifyTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  console.log('Spotify access token refreshed');
  return spotifyToken;
}

async function getSpotifyTrackInfo(trackId) {
  const token = await getSpotifyToken();
  if (!token) return null;

  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.log('Spotify track lookup failed:', res.status);
    return null;
  }

  const data = await res.json();
  return {
    artist:     data?.artists?.[0]?.name ?? null,
    title:      data?.name ?? null,
    spotifyUrl: data?.external_urls?.spotify ?? null,
  };
}

async function searchSpotify(artist, title) {
  const token = await getSpotifyToken();
  if (!token) return null;

  const q = encodeURIComponent(`track:${title} artist:${artist}`);
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    console.log('Spotify search failed:', res.status);
    return null;
  }

  const data = await res.json();
  const track = data?.tracks?.items?.[0];
  if (!track) return null;

  console.log('Spotify search found:', track.external_urls.spotify);
  return track.external_urls.spotify;
}

// --- YouTube Data API ---

async function searchYouTube(artist, title) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

  const q = encodeURIComponent(`${artist} ${title}`);
  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${q}&key=${key}`;
  console.log('YouTube Data API search:', `${artist} - ${title}`);

  let res;
  try {
    res = await fetch(apiUrl);
  } catch (err) {
    console.log('YouTube API fetch failed:', err.message);
    return null;
  }

  if (!res.ok) {
    const errText = await res.text();
    console.log('YouTube API error:', res.status, errText);
    return null;
  }

  const data = await res.json();
  const videoId = data?.items?.[0]?.id?.videoId ?? null;
  if (!videoId) {
    console.log('YouTube API returned no video for:', artist, '-', title);
    return null;
  }

  console.log('YouTube video ID found:', videoId);
  return videoId;
}

// --- Odesli ---

async function fetchOdesli(url, isSpotify = false) {
  const extra = isSpotify ? '&skipCache=true' : '';
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&userCountry=US${extra}`;
  console.log('--- Odesli request URL:', apiUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let res;
  try {
    res = await fetch(apiUrl, { signal: controller.signal });
  } catch (err) {
    console.log('--- Odesli fetch failed or timed out:', err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
  console.log('--- Odesli HTTP status:', res.status);
  const raw = await res.text();
  console.log('--- Odesli raw response:', raw);
  if (!res.ok) return null;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.log('--- Failed to parse Odesli JSON');
    return null;
  }
  console.log('--- linksByPlatform keys:', data.linksByPlatform ? Object.keys(data.linksByPlatform) : 'MISSING');
  return data.linksByPlatform ? data : null;
}

// Resolve YouTube links with guaranteed output:
// 1. Use Odesli's link if present
// 2. Try YouTube Data API for a direct watch link
// 3. Fall back to search URLs so output always has YouTube + YouTube Music
async function resolveYouTubeLinks(links, artist, title) {
  if (links.youtube && links.youtubeMusic) return;

  const videoId = await searchYouTube(artist, title);

  if (videoId) {
    if (!links.youtube)      links.youtube      = { url: `https://www.youtube.com/watch?v=${videoId}` };
    if (!links.youtubeMusic) links.youtubeMusic = { url: `https://music.youtube.com/watch?v=${videoId}` };
  } else {
    if (!links.youtube)      links.youtube      = { url: youtubeSearchUrl(artist, title) };
    if (!links.youtubeMusic) links.youtubeMusic = { url: youtubeMusicSearchUrl(artist, title) };
  }
}

// Resolve Spotify link with guaranteed output:
// 1. Use Odesli's link if present
// 2. Try Spotify search API
// 3. Fall back to Spotify search URL
async function resolveSpotifyLink(links, artist, title) {
  if (links.spotify) return;

  const spotifyUrl = await searchSpotify(artist, title);
  links.spotify = { url: spotifyUrl ?? spotifySearchUrl(artist, title) };
}

async function getOdesliData(url) {
  const clean = cleanUrl(url);
  console.log('Cleaned URL:', clean);
  const isSpotify = clean.includes('open.spotify.com');

  let data = await fetchOdesli(clean, isSpotify);

  if (!data && isSpotify) {
    const trackId = extractSpotifyTrackId(clean);
    if (trackId) {
      const bare = `https://open.spotify.com/track/${trackId}`;
      console.log('Retrying with bare Spotify URL:', bare);
      data = await fetchOdesli(bare, true);
    }
  }

  // Spotify opt-out: Odesli can't process the URL at all — go fully manual
  if (!data && isSpotify) {
    const trackId = extractSpotifyTrackId(clean);
    if (!trackId) return null;

    console.log('Odesli blocked by opt-out, falling back to Spotify + YouTube Data API');
    const info = await getSpotifyTrackInfo(trackId);
    if (!info?.artist || !info?.title) return null;

    const { artist, title, spotifyUrl } = info;
    const links = {};
    if (spotifyUrl) links.spotify = { url: spotifyUrl };

    await resolveYouTubeLinks(links, artist, title);
    await resolveSpotifyLink(links, artist, title);
    return { links, artist, title };
  }

  if (!data) return null;

  const links = data.linksByPlatform;

  // Prefer Spotify catalog for artist/title — it's always accurate.
  // Odesli entity can return the YouTube channel name instead of the real artist.
  let artist = null;
  let title  = null;

  if (links.spotify) {
    const trackId = extractSpotifyTrackId(links.spotify.url);
    if (trackId) {
      const info = await getSpotifyTrackInfo(trackId);
      if (info) ({ artist, title } = info);
    }
  }

  if (!artist || !title) {
    const entity = data.entitiesByUniqueId?.[data.entityUniqueId];
    artist = entity?.artistName ?? null;
    title  = entity?.title ?? null;
  }

  if (!artist || !title) return null;

  await resolveYouTubeLinks(links, artist, title);
  await resolveSpotifyLink(links, artist, title);

  return { links, artist, title };
}

// --- Discord ---

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (recentlySentMessages.has(message.id)) return;

  const urls = [...(message.content.matchAll(MUSIC_URL_REGEX) ?? [])].map((m) => m[0]);
  if (urls.length === 0) return;

  const url = urls[0];
  console.log('Detected music URL:', url);
  let data;
  try {
    data = await getOdesliData(url);
  } catch (err) {
    console.log('Error in getOdesliData:', err);
    return;
  }
  if (!data) {
    console.log('No data returned, skipping reply.');
    return;
  }

  const { links, artist, title } = data;
  console.log('Final links being used:', Object.keys(links));

  const lines = PLATFORM_ORDER
    .filter(({ key }) => links[key])
    .map(({ key, label }) => {
      const u = links[key].url;
      // Leave YouTube bare so Discord auto-embeds the video; suppress all others
      return key === 'youtube' ? `${label}: ${u}` : `${label}: <${u}>`;
    });

  if (lines.length === 0) return;

  const header = artist && title ? `**${artist} - ${title}**\n` : '';
  const body = `${header}${lines.join('\n')}`;

  try {
    await message.delete();
  } catch {
    // delete failed (missing permissions or already gone) — continue to send anyway
  }
  const sent = await message.channel.send(body);
  recentlySentMessages.add(sent.id);
  setTimeout(() => recentlySentMessages.delete(sent.id), 5000);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('error', (err) => console.log('Discord client error:', err));

client.login(process.env.DISCORD_TOKEN);
