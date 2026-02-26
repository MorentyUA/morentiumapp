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
        server.middlewares.use('/api/save-data', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString() });
            req.on('end', () => {
              fs.writeFileSync(path.resolve(process.cwd(), 'src/data.json'), body);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            });
          }
        });
      }
    }
  ],
  server: {
    allowedHosts: true,
  }
})
