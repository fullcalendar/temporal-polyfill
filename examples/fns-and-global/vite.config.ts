import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    // minify: false, // so we can inspect dist for code sharing
  },
})
