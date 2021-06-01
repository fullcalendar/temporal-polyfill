import { balanceTime, balanceTimeFromMs } from './balance'
import { PlainDateTime, PlainDateTimeLikeType } from './plainDateTime'
import { roundMs } from './round'
import { extractTimeMs, extractTimeWithDaysMs } from './separate'
import {
  CompareReturnType,
  DurationType,
  DurationUnitType,
  LocaleType,
  RoundOptionsLikeType,
  UNIT_INCREMENT,
} from './types'
import { toUnitMs } from './utils'

export type DurationLikeType = Partial<DurationType>

type RelativeOptionsType = {
  relativeTo?: PlainDateTime | PlainDateTimeLikeType | string
}

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
    options?: RelativeOptionsType
  ): Duration {
    const otherDuration =
      other instanceof Duration ? other : Duration.from(other)

    if (options?.relativeTo) {
      const start =
        options.relativeTo instanceof PlainDateTime
          ? options.relativeTo
          : PlainDateTime.from(options.relativeTo)
      const end = start.add(this).add(otherDuration)
      return end.since(start)
    } else if (
      this.years ||
      this.months ||
      this.weeks ||
      otherDuration.years ||
      otherDuration.months ||
      otherDuration.weeks
    )
      throw new Error('relativeTo is required for date units')

    const {
      deltaDays,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = balanceTime({
      isoMillisecond: extractTimeMs({
        isoHour: this.hours + otherDuration.hours,
        isoMinute: this.minutes + otherDuration.minutes,
        isoSecond: this.seconds + otherDuration.seconds,
        isoMillisecond: this.milliseconds + otherDuration.milliseconds,
      }),
    })
    return new Duration(
      0,
      0,
      0,
      this.days + otherDuration.days + deltaDays,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond
    )
  }
  subtract(
    other: Duration | DurationLikeType | string,
    options?: RelativeOptionsType
  ): Duration {
    const otherDuration =
      other instanceof Duration ? other : Duration.from(other)
    return this.add(otherDuration.negated(), options)
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
  round(options?: RoundOptionsLikeType & RelativeOptionsType): Duration {
    if (options?.relativeTo) {
      const relative =
        options.relativeTo instanceof PlainDateTime
          ? options.relativeTo
          : PlainDateTime.from(options.relativeTo)
      return relative.add(this).since(relative, options)
    } else if (this.years || this.months || this.weeks)
      throw new Error('relativeTo is required for date units')

    const {
      deltaDays,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = balanceTimeFromMs(
      roundMs(
        extractTimeWithDaysMs({
          isoDay: this.days,
          isoHour: this.hours,
          isoMinute: this.minutes,
          isoSecond: this.seconds,
          isoMillisecond: this.milliseconds,
        }),
        options
      ),
      options
    )
    return new Duration(
      0,
      0,
      0,
      deltaDays,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond
    )
  }

  negated(): Duration {
    return new Duration(
      -this.years || 0,
      -this.months || 0,
      -this.weeks || 0,
      -this.days || 0,
      -this.hours || 0,
      -this.minutes || 0,
      -this.seconds || 0,
      -this.milliseconds || 0
    )
  }
  abs(): Duration {
    return new Duration(
      Math.abs(this.years),
      Math.abs(this.months),
      Math.abs(this.weeks),
      Math.abs(this.days),
      Math.abs(this.hours),
      Math.abs(this.minutes),
      Math.abs(this.seconds),
      Math.abs(this.milliseconds)
    )
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
