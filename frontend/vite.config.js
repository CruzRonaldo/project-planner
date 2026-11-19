import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self' http://127.0.0.1:8000 https://project-planner-to9j.onrender.com https://developer.api.autodesk.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://developer.api.autodesk.com; style-src 'self' 'unsafe-inline' https://developer.api.autodesk.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://developer.api.autodesk.com https://*.googleusercontent.com https://images.unsplash.com; connect-src 'self' http://127.0.0.1:8000 https://project-planner-to9j.onrender.com https://developer.api.autodesk.com https://*.autodesk.com ws://localhost:5173 ws://127.0.0.1:5173; worker-src 'self' blob:; child-src blob:; frame-ancestors 'self'; form-action 'self';",
    },
  },
  resolve: {
    alias: [
      { find: /^exceljs$/, replacement: 'exceljs/dist/exceljs.min.js' },
    ],
  },
})
