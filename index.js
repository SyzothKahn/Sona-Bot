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

function cleanUrl(url) {
  const parsed = new URL(url);
  if (['www.youtube.com', 'youtube.com', 'music.youtube.com'].includes(parsed.hostname)) {
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

// Split a YouTube video title on the first " - " to get { artist, songTitle }.
// Returns null for the artist if no " - " is found.
function splitVideoTitle(videoTitle) {
  const idx = videoTitle.indexOf(' - ');
  if (idx === -1) return { artist: null, songTitle: videoTitle.trim() };
  return {
    artist:    videoTitle.slice(0, idx).trim(),
    songTitle: videoTitle.slice(idx + 3).trim(),
  };
}

function youtubeSearchUrl(artist, title) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`;
}

function youtubeMusicSearchUrl(artist, title) {
  return `https://music.youtube.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
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

// Run a single Spotify search query string, return the first track object or null.
async function spotifySearchQuery(token, q) {
  console.log('Spotify search query:', q);
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    console.log('Spotify search request failed:', res.status);
    return null;
  }
  return (await res.json())?.tracks?.items?.[0] ?? null;
}

// Search Spotify using extracted artist and song title from a YouTube video title.
// Tries in order:
//   1. artist:ARTIST track:SONGTITLE  (structured, most precise)
//   2. Plain text full video title    (fallback when structured returns nothing)
// Returns { url, artist, title } on success, null on failure.
async function searchSpotifyForYouTube(videoTitle) {
  const token = await getSpotifyToken();
  if (!token) return null;

  const { artist, songTitle } = splitVideoTitle(videoTitle);

  const queries = artist
    ? [`artist:${artist} track:${songTitle}`, videoTitle]
    : [videoTitle];

  for (const q of queries) {
    const track = await spotifySearchQuery(token, q);
    if (track) {
      const result = {
        url:    track.external_urls.spotify,
        artist: track.artists?.[0]?.name ?? null,
        title:  track.name ?? null,
      };
      console.log('Spotify search found:', result.artist, '-', result.title);
      return result;
    }
  }

  console.log('Spotify search exhausted all attempts for:', videoTitle);
  return null;
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

// Guarantee YouTube + YouTube Music are in links.
// 1. Already present → done
// 2. YouTube Data API for a direct watch link
// 3. Search URL fallback
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
    if (!links.spotify) links.spotify = { url: `https://open.spotify.com/search/${encodeURIComponent(title)}` };
    return { links, artist, title };
  }

  if (!data) return null;

  const links = data.linksByPlatform;
  const entity = data.entitiesByUniqueId?.[data.entityUniqueId];

  let artist = null;
  let title  = null;

  if (links.spotify) {
    // Source has a Spotify link — use Spotify catalog as authoritative metadata
    const trackId = extractSpotifyTrackId(links.spotify.url);
    if (trackId) {
      const info = await getSpotifyTrackInfo(trackId);
      if (info?.artist && info?.title) ({ artist, title } = info);
    }
    if (!artist || !title) return null;

    await resolveYouTubeLinks(links, artist, title);
  } else {
    // YouTube-sourced: split the video title on " - " to extract artist and song title.
    // Never use Odesli's artistName here — it reflects the YouTube channel, not the real artist.
    const videoTitle = entity?.title ?? null;
    if (!videoTitle) return null;

    const spotifyResult = await searchSpotifyForYouTube(videoTitle);
    if (spotifyResult) {
      links.spotify = { url: spotifyResult.url };
      artist = spotifyResult.artist;
      title  = spotifyResult.title;
    } else {
      // Spotify search failed — derive artist/title from the video title split
      const { artist: splitArtist, songTitle } = splitVideoTitle(videoTitle);
      artist = splitArtist ?? videoTitle;
      title  = songTitle;
      links.spotify = { url: `https://open.spotify.com/search/${encodeURIComponent(videoTitle)}` };
    }

    await resolveYouTubeLinks(links, artist, title);
  }

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
