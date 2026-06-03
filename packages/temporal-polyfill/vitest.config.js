import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './vitest.global-setup.js',
    include: ['src/**/*.test.ts'],
  },
})
