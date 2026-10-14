import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = dirname(fileURLToPath(import.meta.url));
const adminRoot = resolve(configDir, '..');
const frontendRoot = resolve(configDir, '../..');

export default defineConfig({
  root: frontendRoot,
  cacheDir: resolve(configDir, 'node_modules/.vite'),
  plugins: [{
    name: 'click2book-admin-root-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;
        if (pathname !== '/') return next();

        const isSuperUserPortal = String(req.headers.host || '').endsWith(':3004');
        res.writeHead(302, {
          Location: isSuperUserPortal ? '/admin/super-user-login.html' : '/admin/login.html',
        });
        res.end();
      });
    },
  }],
  // Compile JSX with React's automatic runtime so components don't need
  // `import React` in scope.
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    host: '0.0.0.0',
    port: 3003,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
  },
  build: {
    outDir: resolve(adminRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: [
        resolve(adminRoot, 'admin_dashboard.html'),
        resolve(adminRoot, 'login.html'),
        resolve(adminRoot, 'super-user-login.html'),
        resolve(adminRoot, 'revenue-dashboard.html'),
      ],
    },
  },
});
