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
        server.middlewares.use('/api/save-data', (req, res, next) => {
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
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    allowedHosts: true,
  }
})
