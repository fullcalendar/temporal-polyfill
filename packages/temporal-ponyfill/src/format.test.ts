import { tokenFormat } from './format'

test.each([
  ['YYYY-MM-DD', 0, '1970-01-01'],
  ['ddd D, M, YYYY', 1577858400000, 'Wed 1, 1, 2020'],
  ['hh:mm:ss', 10000000, '02:46:40'],
])('token string formatting', (tokenStr, ms, expected) => {
  const str = tokenFormat(tokenStr, ms)
  expect(str).toBe(expected)
})
