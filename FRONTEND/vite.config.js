// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ cambia esto por tu subdominio real:
const NGROK_HOST = 'trust-bob-icons-funny.trycloudflare.com'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // escucha en 0.0.0.0 (necesario para túneles)
    port: 5173,
    // Vite 5+: autoriza host externo
    allowedHosts: [NGROK_HOST],
    // HMR a través de ngrok (para que el WS no quede bloqueado)
    hmr: {
      host: NGROK_HOST,
      protocol: 'wss',     // ngrok https -> usa wss
      clientPort: 443,     // puerto público https
    },
  },
})
