import { balanceDuration } from './balance'
import { PlainDateTime } from './plainDateTime'
import { asRoundOptions, roundPriorities } from './round'
import {
  CompareReturnType,
  DurationType,
  DurationUnitType,
  LocaleType,
  RoundOptionsLikeType,
  RoundOptionsType,
  UNIT_INCREMENT,
} from './types'
import { toUnitMs } from './utils'

export type DurationLikeType = Partial<DurationType>

const getNumberUnitFormat = (number: number, unit: string) => ({
  negative: number < 0,
  format: number ? `${Math.abs(number)}${unit}` : '',
})

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
      return balanceDuration({ milliseconds: thing })
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
      return new Duration(
        thing.years,
        thing.months,
        thing.weeks,
        thing.days,
        thing.hours,
        thing.minutes,
        thing.seconds,
        thing.milliseconds
      )
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

  add(
    other: Duration | DurationLikeType | string,
    options: { relativeTo: PlainDateTime }
  ): Duration {
    const duration = other instanceof Duration ? other : Duration.from(other)
    return balanceDuration(
      new Duration(
        this.years + duration.years,
        this.months + duration.months,
        this.weeks + duration.weeks,
        this.days + duration.days,
        this.hours + duration.hours,
        this.minutes + duration.minutes,
        this.seconds + duration.seconds,
        this.milliseconds + duration.milliseconds
      )
    )
  }
  subtract({
    years = 0,
    months = 0,
    weeks = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
  }: DurationLikeType): Duration {
    return balanceDuration(
      new Duration(
        this.years - years,
        this.months - months,
        this.weeks - weeks,
        this.days - days,
        this.hours - hours,
        this.minutes - minutes,
        this.seconds - seconds,
        this.milliseconds - milliseconds
      )
    )
  }
  total({
    unit,
    relativeTo = new PlainDateTime(1970, 1, 1),
  }: {
    unit: DurationUnitType
    relativeTo?: PlainDateTime
  }): number {
    return (
      (relativeTo.add(this).epochMilliseconds - relativeTo.epochMilliseconds) /
      toUnitMs(unit)
    )
  }
  round(options?: RoundOptionsLikeType): Duration {
    const {
      smallestUnit,
      largestUnit,
      roundingIncrement,
      roundingMode,
    }: RoundOptionsType = asRoundOptions(options)

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
