import { advanceTo } from 'jest-date-mock'
import { Now } from './now'

test('can get epoch ms', () => {
  advanceTo(0)
  expect(Now.epochMilliseconds()).toBe(0)
})
