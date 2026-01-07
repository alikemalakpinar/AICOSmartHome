import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@bridge': path.resolve(__dirname, './src/bridge'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@3d': path.resolve(__dirname, './src/3d'),
      '@voice': path.resolve(__dirname, './src/voice'),
      '@intelligence': path.resolve(__dirname, './src/intelligence'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    target: 'esnext',
    minify: mode === 'embedded' ? 'terser' : 'esbuild',
    sourcemap: mode !== 'embedded',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor': ['react', 'react-dom', 'zustand', 'framer-motion'],
        },
      },
    },
    // Optimize for embedded hardware
    ...(mode === 'embedded' && {
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
    }),
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },
}));
