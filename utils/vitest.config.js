import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  return {
    test: {
      include: ['src/**/*.test.ts'],
    },
  }
})
