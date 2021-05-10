process.env.TZ = 'America/New_York'

export default {
  preset: 'ts-jest',
  // timers: 'modern',
  setupFiles: ['jest-date-mock'],
  verbose: true,
}
