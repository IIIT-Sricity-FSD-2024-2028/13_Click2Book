import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-original-login',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const urlObj = new URL(req.url, 'http://localhost:5176');
          const pathname = urlObj.pathname;

          // 1. Redirect legacy login requests into Customer React login route
          if (pathname === '/login.html' || pathname === '/landing-page/login.html') {
            res.writeHead(302, { Location: '/#login' });
            return res.end();
          }

          // 2. Intercept legacy redirect from login.html back to Customer React app
          if (pathname.includes('/customer/search-trips.html') || pathname === '/search-trips.html') {
            res.writeHead(302, { Location: '/#search-trips' });
            return res.end();
          }

          next();
        });
      },
    },
  ],
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  base: './',
});
