import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isCommunity = process.env.VITE_COMMUNITY === 'true';

  return {
    plugins: [react()],
    build: {
      outDir: isCommunity
        ? './dist/community'
        : '../Server/src/Server/public',
      emptyOutDir: true,
    },
    define: {
      'import.meta.env.VITE_COMMUNITY': JSON.stringify(isCommunity),
    },
  };
});