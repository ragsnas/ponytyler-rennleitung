// Stand-in for https://songlist.ponytyler.de in the e2e stack, so the song
// sync specs run against a fixed, known list instead of the live site.
// Serves the two endpoints be/src/cron/song-sync/song-sync.service.ts reads:
//   GET /                 HTML page (only "listed" songs, same markup as the real site)
//   GET /api/index.php    JSON array of { artist, title, status }
// Zero dependencies; the song list lives in songs.json.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT ?? 8080);
const songs = JSON.parse(fs.readFileSync(path.join(__dirname, 'songs.json'), 'utf8'));

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

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/api/index.php') {
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(songs));
  } else if (pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(renderPage());
  } else {
    res.writeHead(404).end();
  }
});

server.listen(PORT, () => console.log(`songlist stub listening on :${PORT}`));
