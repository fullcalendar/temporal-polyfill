import { CalendarId } from './types'
import { dateValue, toUnitMs } from './utils'

export const dateParse = (
  str: string
): { epochMilliseconds: number; timeZone: string; calendar: CalendarId } => {
  const regex = /^([1-9]\d{3})-(0[1-9]|1[0-2])-([0-2]\d)(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:[.:](\d{3}))?)?(?:(Z|[+-][01]\d:[0-5]\d))?(?:\[(\w+\/\w+)\])?(?:\[u-ca=(\w+)\])?$/
  const matches = str.match(regex)

  if (matches) {
    const sliced = matches.slice(1)
    const [
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    ] = sliced.reduce(
      (acc, val, index) => {
        acc[index] = Number(val)
        return acc
      },
      [0, 0, 0, 0, 0, 0, 0]
    )

    let offset = 0
    const offsetRegex = /([+-])(\d{2}):(\d{2})/
    const offsetMatches = sliced[7].match(offsetRegex)

    if (offsetMatches) {
      const [plusminus, hrs, mins] = offsetMatches.slice(1)
      offset =
        (plusminus ? 1 : -1) *
        (Number(hrs) * toUnitMs('hours') + Number(mins) * toUnitMs('minutes'))
    }

    const timeZone = sliced[8]
    const calendar = sliced[9]

    const epochMilliseconds =
      dateValue({
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond: isoMillisecond || 0,
      }) + offset

    return {
      epochMilliseconds,
      timeZone,
      calendar: calendar as CalendarId,
    }
  }
  throw new Error('Invalid String')
}
