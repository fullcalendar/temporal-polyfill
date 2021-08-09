import { CalendarId } from '../calendar'
import { isoDateToMs, MS_FOR, UNIT_INCREMENT } from './convert'
import { Duration } from '../duration'

/** Parse an ISO format date string into milliseconds, timezone, and calendar */
export const parseDate = (
  str: string
): { epochMilliseconds: number; timeZone: string; calendar: CalendarId } => {
  const regex =
    /^([1-9]\d{3})-(0[1-9]|1[0-2])-([0-2]\d)(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:[.:](\d{3}))?)?(?:(Z|[+-][01]\d:[0-5]\d))?(?:\[(\w+\/\w+)\])?(?:\[u-ca=(\w+)\])?$/
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
        (Number(hrs) * MS_FOR.HOUR + Number(mins) * MS_FOR.MINUTE)
    }

    const timeZone = sliced[8]
    const calendar = sliced[9]

    const epochMilliseconds =
      isoDateToMs({
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

/** Parse a Duration string into a Duration object */
export const parseDuration = (str: string): Duration => {
  const regex =
    /^(-|\+)?P(?:([-+]?[\d,.]*)Y)?(?:([-+]?[\d,.]*)M)?(?:([-+]?[\d,.]*)W)?(?:([-+]?[\d,.]*)D)?(?:T(?:([-+]?[\d,.]*)H)?(?:([-+]?[\d,.]*)M)?(?:([-+]?[\d,.]*)S)?)?$/
  const matches = str.match(regex)

  if (matches) {
    const [years, months, weeks, days, hours, minutes, seconds] = matches
      .slice(2)
      .map((value) => {
        return Number(value || 0)
      })
    return new Duration(
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      // Remove milliseconds part from seconds
      Math.floor(seconds),
      // Milliseconds need to be converted out of .xxx format
      Math.floor((seconds % 1) * UNIT_INCREMENT.SECOND)
    )
  }
  throw new Error('Invalid String')
}
