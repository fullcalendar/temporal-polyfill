import { PlainDateTime, ZonedDateTime } from 'temporal-polyfill'
import { TokenDateTimeFormat } from './index'

test.each([
  ['YYYY-MM-DD', new PlainDateTime(1970, 1, 1), '1970-01-01'],
  ['ddd D, M, YYYY', new PlainDateTime(2020, 1, 1), 'Wed 1, 1, 2020'],
  ['hh:mm:ss', new PlainDateTime(1970, 1, 1, 2, 46, 40), '02:46:40'],
  ['hh A', new PlainDateTime(2000, 5, 5, 8, 32), '08 AM'],
  ['HH a', new PlainDateTime(2000, 5, 5, 8, 32), '08 am'],
  ['E', new PlainDateTime(2021, 6, 1), '2'],
  ['W [weeks]', new PlainDateTime(2021, 1, 30), '4 weeks'],
  ['Do [day]', new PlainDateTime(2021, 1, 30), '30th day'],
  ['Wo [week]', new PlainDateTime(2021, 1, 8), '1st week'],
])(
  'token string formatting(%s) for PlainDateTime',
  (tokenStr, date, expected) => {
    const formatter = new TokenDateTimeFormat(tokenStr)
    expect(formatter.format(date)).toBe(expected)
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
    const formatter = new TokenDateTimeFormat(tokenStr)
    expect(formatter.format(date)).toBe(expected)
  }
)

test.each([
  [
    'YYYY[YYYY]-MM[MM]-DD[DD]',
    new ZonedDateTime(0, 'UTC'),
    '1970YYYY-01MM-01DD',
  ],
  [
    'YYYY[YYYY]-MM[MM]-DD[DD]',
    new PlainDateTime(1970, 1, 1),
    '1970YYYY-01MM-01DD',
  ],
  [
    'YYYY[YYYY]-MM[MM]-DD[DD]',
    new PlainDateTime(2021, 8, 13),
    '2021YYYY-08MM-13DD',
  ],
  ['[word] YYYY-MM-DD', new PlainDateTime(2021, 8, 13), 'word 2021-08-13'],
  ['MM [a literal MMMM]', new PlainDateTime(2021, 8, 13), '08 a literal MMMM'],
])('escaped literals work for "%s"', (tokenStr, date, expected) => {
  const formatter = new TokenDateTimeFormat(tokenStr)
  expect(formatter.format(date)).toBe(expected)
})
