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

          // 1. Serve original login.html from front-end/landing-page/login.html
          if (pathname === '/login.html' || pathname === '/landing-page/login.html') {
            const loginFilePath = path.resolve(__dirname, '../../landing-page/login.html');
            if (fs.existsSync(loginFilePath)) {
              let html = fs.readFileSync(loginFilePath, 'utf-8');
              const adapterScript = `
<script>
  (function() {
    try {
      var p = new URLSearchParams(window.location.search).get('panel');
      if (p === 'signup' && typeof showPanel === 'function') { showPanel('signup'); }
      var prompt = sessionStorage.getItem('c2b_loginPrompt');
      if (prompt && typeof showErr === 'function') {
        sessionStorage.removeItem('c2b_loginPrompt');
        showErr('errMsg', prompt);
      }
    } catch(e) {}
  })();
</script>
</body>`;
              html = html.replace('</body>', adapterScript);
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              return res.end(html);
            }
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
