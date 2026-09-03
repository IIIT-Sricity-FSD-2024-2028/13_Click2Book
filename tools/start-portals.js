/**
 * Click2Book — Multi-Port Actor Portal Launcher
 * ─────────────────────────────────────────────
 * Launches 5 dedicated HTTP servers for each actor/portal:
 *   - Customer Portal:         http://localhost:3001
 *   - Service Provider Portal: http://localhost:3002
 *   - Admin Portal:            http://localhost:3003
 *   - Super User Portal:       http://localhost:3004
 *   - Customer Support Portal: http://localhost:3005
 *
 * Backend NestJS API remains at: http://localhost:3000/api
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..', 'front-end');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const PORTALS = [
  {
    name: 'Customer Portal',
    port: 3001,
    baseSubdir: 'landing-page',
    defaultFile: 'index.html',
    badge: '👤 CUSTOMER',
  },
  {
    name: 'Service Provider Portal',
    port: 3002,
    baseSubdir: 'serviceprovider',
    defaultFile: 'login.html',
    badge: '🚌 SERVICE PROVIDER',
  },
  {
    name: 'Admin Portal',
    port: 3003,
    baseSubdir: 'admin',
    defaultFile: 'login.html',
    badge: '🛡️ ADMIN',
  },
  {
    name: 'Super User Portal',
    port: 3004,
    baseSubdir: 'admin',
    defaultFile: 'super-user-login.html',
    badge: '⚡ SUPER USER',
  },
  {
    name: 'Customer Support Portal',
    port: 3005,
    baseSubdir: 'supportagent',
    defaultFile: 'login.html',
    badge: '🎧 CUSTOMER SUPPORT',
  },
];

function resolveFilePath(portal, rawUrl) {
  let reqPath = decodeURIComponent(rawUrl.split('?')[0]);

  // Handle root /
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/' + portal.defaultFile;
  }

  // 1. Try resolving relative to portal's baseSubdir (e.g. front-end/serviceprovider/styles.css)
  const portalSubdirPath = path.join(FRONTEND_DIR, portal.baseSubdir, reqPath);
  if (fs.existsSync(portalSubdirPath) && fs.statSync(portalSubdirPath).isFile()) {
    return portalSubdirPath;
  }

  // 2. Try resolving relative to front-end root (e.g. front-end/api-connector.js or front-end/serviceprovider/styles.css)
  const frontendRootPath = path.join(FRONTEND_DIR, reqPath);
  if (fs.existsSync(frontendRootPath) && fs.statSync(frontendRootPath).isFile()) {
    return frontendRootPath;
  }

  // 3. Try directory index inside baseSubdir
  const subFolderIndex = path.join(FRONTEND_DIR, portal.baseSubdir, reqPath, 'index.html');
  if (fs.existsSync(subFolderIndex) && fs.statSync(subFolderIndex).isFile()) {
    return subFolderIndex;
  }

  // 4. Try directory index in front-end root
  const rootFolderIndex = path.join(FRONTEND_DIR, reqPath, 'index.html');
  if (fs.existsSync(rootFolderIndex) && fs.statSync(rootFolderIndex).isFile()) {
    return rootFolderIndex;
  }

  return null;
}

function createPortalServer(portal) {
  const server = http.createServer((req, res) => {
    const filePath = resolveFilePath(portal, req.url);

    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#fff;">
          <h2>404 — File Not Found</h2>
          <p>Portal: <strong>${portal.name}</strong> (Port ${portal.port})</p>
          <p>Requested: <code>${req.url}</code></p>
          <p><a href="/" style="color:#f97316;">Go to Portal Home →</a></p>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });

    fs.createReadStream(filePath).pipe(res);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`  [${portal.badge}]  http://localhost:${portal.port}  (⚠️ Port ${portal.port} already running)`);
    } else {
      console.error(`  [${portal.badge}] Error on port ${portal.port}:`, err.message);
    }
  });

  server.listen(portal.port, () => {
    console.log(`  [${portal.badge}]  http://localhost:${portal.port}`);
  });

  return server;
}

console.log('\n=============================================================');
console.log('🚀 CLICK2BOOK — MULTI-PORT ACTOR PORTALS LAUNCHER');
console.log('=============================================================');
console.log('  Backend API:                 http://localhost:3000/api');
console.log('-------------------------------------------------------------');

PORTALS.forEach(portal => createPortalServer(portal));

console.log('=============================================================\n');
