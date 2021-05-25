import { PlainDateTime } from './plainDateTime'
import {
  CompareReturnType,
  DurationType,
  DurationUnitType,
  LocaleType,
  RoundLikeType,
  RoundType,
  UNIT_INCREMENT,
} from './types'
import { roundDefaults, roundPriorities } from './utils'
import { ZonedDateTime } from './zonedDateTime'

export type DurationLikeType = Partial<DurationType>

const rollover = ({
  years = 0,
  months = 0,
  weeks = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
}: DurationLikeType): Duration => {
  //MS
  seconds += Math.trunc(milliseconds / UNIT_INCREMENT.SECOND)
  milliseconds = Math.trunc(milliseconds % UNIT_INCREMENT.SECOND)
  //SECS
  minutes += Math.trunc(seconds / UNIT_INCREMENT.MINUTE)
  seconds = Math.trunc(seconds % UNIT_INCREMENT.MINUTE)
  //MINS
  hours += Math.trunc(minutes / UNIT_INCREMENT.HOUR)
  minutes = Math.trunc(minutes % UNIT_INCREMENT.HOUR)
  //HOURS
  days += Math.trunc(hours / UNIT_INCREMENT.DAY)
  hours = Math.trunc(hours % UNIT_INCREMENT.DAY)
  //DAYS
  weeks += Math.trunc(days / UNIT_INCREMENT.WEEK)
  days = Math.trunc(days % UNIT_INCREMENT.WEEK)
  //WEEKS
  months += Math.trunc(weeks / UNIT_INCREMENT.MONTH)
  weeks = Math.trunc(weeks % UNIT_INCREMENT.MONTH)
  //MONTHS
  years += Math.trunc(months / UNIT_INCREMENT.YEAR)
  months = Math.trunc(months % UNIT_INCREMENT.YEAR)

  // The '|| 0' is done to prevent -0 from cropping up
  return new Duration(
    years || 0,
    months || 0,
    weeks || 0,
    days || 0,
    hours || 0,
    minutes || 0,
    seconds || 0,
    milliseconds || 0
  )
}
const getNumberUnitFormat = (number: number, unit: string) => ({
  negative: number < 0,
  format: number ? `${Math.abs(number)}${unit}` : '',
})

// TODO: We need to deal with overflow on any of the fields
export class Duration {
  constructor(
    readonly years: number = 0,
    readonly months: number = 0,
    readonly weeks: number = 0,
    readonly days: number = 0,
    readonly hours: number = 0,
    readonly minutes: number = 0,
    readonly seconds: number = 0,
    readonly milliseconds: number = 0
  ) {}

  static from(thing: any): Duration {
    if (typeof thing === 'string') {
      const regex = /^(-|\+)?P(?:([-+]?[\d,.]*)Y)?(?:([-+]?[\d,.]*)M)?(?:([-+]?[\d,.]*)W)?(?:([-+]?[\d,.]*)D)?(?:T(?:([-+]?[\d,.]*)H)?(?:([-+]?[\d,.]*)M)?(?:([-+]?[\d,.]*)S)?)?$/
      const matches = thing.match(regex)
      if (matches) {
        const [
          years,
          months,
          weeks,
          days,
          hours,
          minutes,
          seconds,
        ] = matches.slice(2).map((value) => Number(value || 0))
        return new Duration(
          years,
          months,
          weeks,
          days,
          hours,
          minutes,
          Math.floor(seconds),
          Math.floor((seconds % 1) * UNIT_INCREMENT.SECOND)
        )
      }
      throw new Error('Invalid String')
    } else if (typeof thing === 'number') {
      return rollover({ milliseconds: thing })
    } else if (
      thing.years ||
      thing.months ||
      thing.weeks ||
      thing.days ||
      thing.hours ||
      thing.minutes ||
      thing.seconds ||
      thing.milliseconds
    )
      return rollover({
        years: thing.years,
        months: thing.months,
        weeks: thing.weeks,
        days: thing.days,
        hours: thing.hours,
        minutes: thing.minutes,
        seconds: thing.seconds,
        milliseconds: thing.milliseconds,
      })
    throw new Error('Invalid Object')
  }
  static compare(
    one: Duration,
    two: Duration,
    {
      relativeTo = new PlainDateTime(1970, 1, 1),
    }: { relativeTo: PlainDateTime } // FIXME: It would be better to use ZonedDateTime here but it doesn't have an add method for now
  ): CompareReturnType {
    return PlainDateTime.compare(relativeTo.add(one), relativeTo.add(two))
  }

  with({
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
  }: DurationLikeType) {
    return new Duration(
      years || this.years,
      months || this.months,
      weeks || this.weeks,
      days || this.days,
      hours || this.hours,
      minutes || this.minutes,
      seconds || this.seconds,
      milliseconds || this.milliseconds
    )
  }

  add(durationLike: DurationLikeType) {}
  subtract(durationLike: DurationLikeType) {}
  total(unit: DurationUnitType) {}
  round(options?: RoundLikeType) {
    const {
      smallestUnit,
      largestUnit,
      roundingIncrement,
      roundingMode,
    }: RoundType = {
      ...roundDefaults,
      ...options,
    }

    const smallestIndex = roundPriorities.indexOf(smallestUnit)
    const largestIndex = roundPriorities.indexOf(largestUnit)
    if (smallestIndex < largestIndex)
      throw new RangeError('largestUnit cannot be smaller than smallestUnit')

    return Duration.from(this)
  }

  toString() {
    const Y = getNumberUnitFormat(this.years, 'Y')
    const M = getNumberUnitFormat(this.months, 'M')
    const W = getNumberUnitFormat(this.weeks, 'W')
    const D = getNumberUnitFormat(this.days, 'D')
    const H = getNumberUnitFormat(this.hours, 'H')
    const m = getNumberUnitFormat(this.minutes, 'M')
    const S = getNumberUnitFormat(
      this.seconds + this.milliseconds / UNIT_INCREMENT.SECOND,
      'S'
    )

    const T = H.format || m.format || S.format ? 'T' : ''
    const P =
      Y.negative ||
      M.negative ||
      W.negative ||
      D.negative ||
      H.negative ||
      m.negative ||
      S.negative
        ? '-'
        : ''

    const result = `P${Y.format}${M.format}${W.format}${D.format}${T}${H.format}${m.format}${S.format}`
    return result === 'P' ? 'P0D' : `${P}${result}`
  }
  toLocaleString(locale: LocaleType) {}
}
