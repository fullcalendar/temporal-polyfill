import { PlainDateTime, ZonedDateTime } from 'temporal-ponyfill'
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

test.each([
  ['YYYY-MM-DD', new ZonedDateTime(0, 'UTC'), '1970-01-01'],
  [
    'ddd D, M, YYYY',
    new ZonedDateTime(Date.UTC(2020, 0, 1), 'America/New_York'),
    'Tue 31, 12, 2019',
  ],
  [
    'HH:mm:ss',
    new ZonedDateTime(Date.UTC(1970, 0, 1, 2, 46, 40), 'America/New_York'),
    '21:46:40',
  ],
])(
  'token string formatting(%s) for ZonedDateTime',
  (tokenStr, date, expected) => {
    const str = format(tokenStr, date)
    expect(str).toBe(expected)
  }
)
