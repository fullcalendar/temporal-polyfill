import { Calendar } from './calendar'
import { CalendarType } from './types'

test('can instantiate', () => {
  const calendar = new Calendar()
  expect(calendar).toBeDefined()
})

test.each<[CalendarType]>([['iso8601'], ['gregory']])('can return %s', (id) => {
  const calendar = new Calendar(id)
  expect(calendar.id).toBe(id)
})
