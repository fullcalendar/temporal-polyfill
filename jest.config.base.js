process.env.TZ = 'America/New_York'

export default {
  preset: 'ts-jest',
  roots: ['<rootDir>/src'],
  // timers: 'modern',
  setupFiles: ['jest-date-mock'],
  verbose: true,
}
