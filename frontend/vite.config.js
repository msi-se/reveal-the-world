/* eslint-disable no-undef */
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  define: {
    VITE_TENANT: process.env.VITE_BACKEND_URL,
    VITE_TENANT_CLIENT_ID: process.env.VITE_BACKEND_URL,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
