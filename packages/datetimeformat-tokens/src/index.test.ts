import { Temporal } from 'temporal-polyfill'
import { TokenDateTimeFormat } from './index'

const { ZonedDateTime, PlainDateTime } = Temporal

const plainDates = [
  new PlainDateTime(1970, 1, 1, 2, 46, 40),
  new PlainDateTime(2020, 1, 1, 0, 0, 0),
  new PlainDateTime(2000, 5, 5, 8, 32),
  new PlainDateTime(2021, 6, 1, 15, 18, 6),
  new PlainDateTime(2021, 1, 30, 1, 2, 3),
  new PlainDateTime(2021, 1, 8, 1, 1, 1),
  new PlainDateTime(2021, 8, 13, 1, 1, 1),
]

test.each`
  tokenStr            | date             | expected
  ${'YYYY-MM-DD'}     | ${plainDates[0]} | ${'1970-01-01'}
  ${'ddd D, M, YYYY'} | ${plainDates[1]} | ${'Wed 1, 1, 2020'}
  ${'hh:mm:ss'}       | ${plainDates[0]} | ${'02:46:40'}
  ${'hh A'}           | ${plainDates[2]} | ${'08 AM'}
  ${'HH a'}           | ${plainDates[2]} | ${'08 am'}
  ${'E'}              | ${plainDates[3]} | ${'2'}
  ${'W [weeks]'}      | ${plainDates[4]} | ${'4 weeks'}
  ${'Do [day]'}       | ${plainDates[4]} | ${'30th day'}
  ${'Wo [week]'}      | ${plainDates[5]} | ${'1st week'}
`(
  'token string formatting($tokenStr) for PlainDateTime',
  ({ tokenStr, date, expected }) => {
    const formatter = new TokenDateTimeFormat(tokenStr)
    expect(formatter.format(date)).toBe(expected)
  },
)

const zonedDates = [
  new ZonedDateTime(0n, 'UTC'),
  new ZonedDateTime(BigInt(Date.UTC(2020, 0, 1)) * 1000000n, 'America/New_York'),
  new ZonedDateTime(BigInt(Date.UTC(1970, 0, 1, 2, 46, 40)) * 1000000n, 'America/New_York'),
]

test.each`
  tokenStr            | date             | expected
  ${'YYYY-MM-DD'}     | ${zonedDates[0]} | ${'1970-01-01'}
  ${'ddd D, M, YYYY'} | ${zonedDates[1]} | ${'Tue 31, 12, 2019'}
  ${'HH:mm:ss'}       | ${zonedDates[2]} | ${'21:46:40'}
`(
  'token string formatting($tokenStr) for ZonedDateTime',
  ({ tokenStr, date, expected }) => {
    const formatter = new TokenDateTimeFormat(tokenStr)
    expect(formatter.format(date)).toBe(expected)
  },
)

test.each`
  tokenStr                      | date             | expected
  ${'YYYY[YYYY]-MM[MM]-DD[DD]'} | ${zonedDates[0]} | ${'1970YYYY-01MM-01DD'}
  ${'YYYY[YYYY]-MM[MM]-DD[DD]'} | ${plainDates[0]} | ${'1970YYYY-01MM-01DD'}
  ${'YYYY[YYYY]-MM[MM]-DD[DD]'} | ${plainDates[6]} | ${'2021YYYY-08MM-13DD'}
  ${'[word] YYYY-MM-DD'}        | ${plainDates[6]} | ${'word 2021-08-13'}
  ${'MM [a literal MMMM]'}      | ${plainDates[6]} | ${'08 a literal MMMM'}
`('escaped literals work for "%s"', ({ tokenStr, date, expected }) => {
  const formatter = new TokenDateTimeFormat(tokenStr)
  expect(formatter.format(date)).toBe(expected)
})
