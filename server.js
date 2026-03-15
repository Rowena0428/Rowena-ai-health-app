import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = `${__dirname}${parsedUrl.pathname}`;

  // Default to index.html for root or SPA routes
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
    pathname = path.join(__dirname, 'index.html');
  } else {
    // If the path has no extension, treat it as SPA route and serve index.html
    if (!path.extname(pathname)) {
      pathname = path.join(__dirname, 'index.html');
    }
  }

  fs.stat(pathname, (err, stats) => {
    if (!err && stats.isDirectory()) {
      pathname = path.join(pathname, 'index.html');
    }

    fs.readFile(pathname, (readErr, data) => {
      if (readErr) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(pathname).toLowerCase();
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', mimeType);
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

