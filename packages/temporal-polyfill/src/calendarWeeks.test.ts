import { Calendar } from './calendar'
import { weekOfYear } from './calendarWeeks'
import { PlainDate } from './plainDate'

test.each`
  date                           | dow  | doy  | expected
  ${new PlainDate(1970, 1, 1)}   | ${0} | ${4} | ${1}
  ${new PlainDate(1970, 1, 8)}   | ${0} | ${4} | ${2}
  ${new PlainDate(2021, 1, 1)}   | ${0} | ${4} | ${53}
  ${new PlainDate(2020, 12, 29)} | ${0} | ${4} | ${53}
  ${new PlainDate(2021, 1, 7)}   | ${0} | ${4} | ${1}
  ${new PlainDate(2021, 1, 7)}   | ${0} | ${3} | ${1}
  ${new PlainDate(2021, 1, 7)}   | ${2} | ${3} | ${1}
`(
  'computeWeekOfYear works for %s with dow: %s and doy: %s',
  ({ date, dow, doy, expected }) => {
    const calendar = new Calendar()
    expect(weekOfYear(date, calendar, dow, doy)).toBe(expected)
  }
)
