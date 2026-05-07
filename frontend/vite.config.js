import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // server configuraiton
  // api proxy strips the /api prefix and forward to the backend container
  // i.e., frontend calls /api/auth/login -> backend changes that to backend:8000/auth/login
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // jsdom is used as tests validating browser API wiring require a DOM
  test: {
    environment: 'jsdom',

    // Prevent having to import at the top of each test file
    globals: true,

    // setup.js will run before each test file
    setupFiles: './src/test/setup.js',

    // test file are located in their own directory
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
