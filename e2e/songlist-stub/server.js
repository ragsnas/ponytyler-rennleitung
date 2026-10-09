// Stand-in for https://songlist.ponytyler.de in the e2e stack, so the song
// sync specs run against a fixed, known list instead of the live site.
// Serves the two endpoints be/src/cron/song-sync/song-sync.service.ts reads:
//   GET /                 HTML page (only "listed" songs, same markup as the real site)
//   GET /api/index.php    JSON array of { artist, title, status }
// Zero dependencies; the default song list lives in songs.json.
//
// Test control (the stack publishes this port on the host, see
// docker-compose.e2e.yml), so a spec can change what the "cloud" serves:
//   PUT    /__admin/songs   body: JSON array of { artist, title, status }; replaces the list
//   DELETE /__admin/songs   back to songs.json

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT ?? 8080);
const defaultSongs = JSON.parse(fs.readFileSync(path.join(__dirname, 'songs.json'), 'utf8'));
let songs = defaultSongs;

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#039;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function renderPage() {
  const byArtist = new Map();
  for (const song of songs.filter((s) => s.status === 'listed')) {
    byArtist.set(song.artist, [...(byArtist.get(song.artist) ?? []), song.title]);
  }
  const blocks = [...byArtist].map(
    ([artist, titles]) =>
      `<div class='content'><span class='artist-name'>${escapeHtml(artist)}</span>` +
      `<div class='song-list'>${titles.map((t) => `<div class='song'>${escapeHtml(t)}</div>`).join('')}</div></div>`,
  );
  return `<!doctype html><html><body>${blocks.join('\n')}</body></html>`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleAdmin(req, res) {
  if (req.method === 'PUT') {
    try {
      const body = JSON.parse(await readBody(req));
      if (!Array.isArray(body)) {
        throw new Error('expected a JSON array');
      }
      songs = body;
    } catch (error) {
      res.writeHead(400).end(String(error));
      return;
    }
  } else if (req.method === 'DELETE') {
    songs = defaultSongs;
  } else {
    res.writeHead(405).end();
    return;
  }
  res.writeHead(204).end();
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/__admin/songs') {
    void handleAdmin(req, res);
  } else if (pathname === '/api/index.php') {
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(songs));
  } else if (pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(renderPage());
  } else {
    res.writeHead(404).end();
  }
});

server.listen(PORT, () => console.log(`songlist stub listening on :${PORT}`));
