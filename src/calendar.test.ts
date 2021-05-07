import { Calendar } from './calendar'

test('can instantiate', () => {
  const calendar = new Calendar()
  expect(calendar).toBeDefined()
})

test.each([['iso8601'], ['gregory']])('can return id', (id) => {
  const calendar = new Calendar(id)
  expect(calendar.id).toBe(id)
})
