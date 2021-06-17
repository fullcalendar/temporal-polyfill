import { PlainDateTime } from 'temporal-ponyfill'
import { format } from './format'

test.each([
  ['YYYY-MM-DD', new PlainDateTime(1970, 1, 1), '1970-01-01'],
  ['ddd D, M, YYYY', new PlainDateTime(2020, 1, 1), 'Wed 1, 1, 2020'],
  ['hh:mm:ss', new PlainDateTime(1970, 1, 1, 2, 46, 40), '02:46:40'],
])(
  'token string formatting(%s) for PlainDateTime',
  (tokenStr, date, expected) => {
    const str = format(tokenStr, date)
    expect(str).toBe(expected)
  }
)
