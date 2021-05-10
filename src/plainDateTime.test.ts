import { PlainDateTime } from './plainDateTime'

test('can instantiate', () => {
  const date = new PlainDateTime(1970, 0, 0)
  expect(date).toBeDefined()
})
