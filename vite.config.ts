import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'local-admin-api',
      configureServer(server) {
        server.middlewares.use('/api/save-data', async (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString() });
            req.on('end', () => {
              try {
                const targetPath = path.resolve(process.cwd(), 'src/data.json');
                fs.writeFileSync(targetPath, body);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (e: any) {
                console.error("Vite API Error writing data.json:", e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message || 'Server error' }));
              }
            });
          } else if (req.url === '/api/github-pull' && req.method === 'POST') {
            try {
              // Fetch latest JSON from the raw Github repository link
              const githubUrl = 'https://raw.githubusercontent.com/MorentyUA/morentiumapp/main/src/data.json';
              // Add a timestamp query param to bypass GitHub's aggressive caching
              const response = await fetch(`${githubUrl}?t=${Date.now()}`);

              if (!response.ok) {
                targetRes(res, 500, { error: `GitHub fetch failed: ${response.statusText}` });
                return;
              }

              const remoteData = await response.text();

              // Verify it's actually valid JSON before destroying our local file
              JSON.parse(remoteData);

              const targetPath = path.resolve(process.cwd(), 'src/data.json');
              fs.writeFileSync(targetPath, remoteData);

              targetRes(res, 200, { success: true, message: 'Local data.json synced with Vercel/GitHub' });
            } catch (e: any) {
              console.error("Vite API Error pulling data.json from GitHub:", e);
              targetRes(res, 500, { error: e.message || 'Server error pulling from GitHub' });
            }
          } else {
            next();
          }
        });

        function targetRes(res: any, code: number, data: any) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = code;
          res.end(JSON.stringify(data));
        }
      }
    }
  ],
  server: {
    allowedHosts: true,
  }
})
