import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Painel admin AjuLabs — SPA web (separado dos apps mobile).
// A URL da API vem de VITE_API_URL (definida no ambiente de build/deploy).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
});
