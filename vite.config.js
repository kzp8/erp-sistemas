import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

function autoPocketBasePlugin() {
  return {
    name: 'auto-pocketbase',
    configureServer() {
      const checkReq = http.get('http://127.0.0.1:8090/api/health', (res) => {
        if (res.statusCode === 200) {
          console.log('\x1b[32m[PocketBase] Base de datos local activa en http://127.0.0.1:8090\x1b[0m');
        }
      });
      checkReq.on('error', () => {
        const isWindows = process.platform === 'win32';
        const binaryName = isWindows ? 'pocketbase.exe' : 'pocketbase';
        const pbPath = path.resolve(process.cwd(), 'backend', binaryName);
        if (fs.existsSync(pbPath)) {
          console.log('\x1b[36m[PocketBase] Arrancando PocketBase local automáticamente...\x1b[0m');
          const child = spawn(pbPath, ['serve'], {
            stdio: 'ignore',
            detached: true,
            shell: true,
          });
          child.unref();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    autoPocketBasePlugin(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        ws: true,
      },
      '/_': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

