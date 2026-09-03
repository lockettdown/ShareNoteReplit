const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..', process.env.WEB_DIST_DIR || 'dist-local');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'content-type': mimeTypes[ext] || 'application/octet-stream',
  });
  fs.createReadStream(filePath).pipe(response);
}

function resolvePath(urlPath) {
  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(root, safePath);
  return filePath.startsWith(root) ? filePath : null;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  const filePath = resolvePath(url.pathname);
  const indexPath = path.join(root, 'index.html');

  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(response, filePath);
    return;
  }

  if (fs.existsSync(indexPath)) {
    sendFile(response, indexPath);
    return;
  }

  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(`Missing web build at ${root}`);
});

server.listen(port, host, () => {
  console.log(`Serving Expo web build from ${root}`);
  console.log(`Local: http://${host}:${port}/`);
});
