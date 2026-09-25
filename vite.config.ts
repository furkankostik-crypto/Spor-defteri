import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { remoteTunnelPlugin } from './vite-plugin-remote-tunnel';

export default defineConfig({
  plugins: [react(), remoteTunnelPlugin()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\') || id.includes('scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
            return 'vendor-firebase-firestore';
          }
          if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
            return 'vendor-firebase-auth';
          }
          if (id.includes('@firebase/') || id.includes('firebase/')) {
            return 'vendor-firebase-app';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('canvas-confetti')) {
            return 'vendor-confetti';
          }
        }
      }
    }
  }
});
