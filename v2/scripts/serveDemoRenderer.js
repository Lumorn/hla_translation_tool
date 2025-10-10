#!/usr/bin/env node
'use strict';

// Ein einfacher HTTP-Server, der die V2-Renderer-Dateien sowie das Demo-Projekt ausliefert.
// Dadurch kann die Demo-Oberfläche ohne Electron getestet oder für Screenshots geladen werden.

const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = Number(process.env.PORT || 4173);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_FILE = path.join(ROOT_DIR, 'renderer', 'index.html');

/**
 * Ermittelt einen passenden MIME-Typ auf Basis der Dateiendung.
 * Die Auswahl ist klein, deckt aber alle aktuell genutzten Assets ab.
 * @param {string} ext
 * @returns {string}
 */
function resolveMimeType(ext) {
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.txt':
      return 'text/plain; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Sichert den angeforderten Pfad gegen Pfadmanipulationen ab und liefert den Dateipfad.
 * @param {string} requestPath
 * @returns {string}
 */
function resolveFilePath(requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0] || '/');
  if (decoded === '/' || decoded === '') {
    return DEFAULT_FILE;
  }

  const normalized = path.posix.normalize(decoded).replace(/^\/+/, '');
  const joined = path.join(ROOT_DIR, normalized);
  if (!joined.startsWith(ROOT_DIR)) {
    throw Object.assign(new Error('Pfad liegt außerhalb des erlaubten Verzeichnisses.'), { statusCode: 403 });
  }
  return joined;
}

const server = http.createServer(async (req, res) => {
  try {
    const filePath = resolveFilePath(req.url || '/');
    let finalPath = filePath;

    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        finalPath = path.join(filePath, 'index.html');
      }
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        throw Object.assign(new Error('Datei nicht gefunden.'), { statusCode: 404 });
      }
      throw error;
    }

    const data = await fs.readFile(finalPath);
    res.writeHead(200, { 'Content-Type': resolveMimeType(path.extname(finalPath)) });
    res.end(data);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Interner Serverfehler.' : error.message;
    res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
  }
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, () => {
  // Kurzer Hinweis, wie der Demo-Modus aufgerufen wird.
  console.log(`V2-Demo-Renderer läuft unter http://localhost:${PORT}/renderer/index.html#demo`);
});
