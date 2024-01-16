/* eslint-disable no-undef */
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const TENANT = process.env.VITE_TENANT;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  base: TENANT === 'default' ? '/' : `/${TENANT}/`,
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
