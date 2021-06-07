import { balanceTime } from './balance'
import { PlainDateTime } from './plainDateTime'
import { roundMs } from './round'
import { extractTimeMs, extractTimeWithDaysMs } from './separate'
import {
  CompareReturnType,
  DurationLikeType,
  DurationUnitType,
  LocaleType,
  PlainDateTimeLikeType,
  RoundOptionsLikeType,
  UNIT_INCREMENT,
} from './types'
import { toUnitMs } from './utils'

type UnitOptionsType = {
  unit: DurationUnitType
}

type RelativeOptionsType = {
  relativeTo?: PlainDateTime | PlainDateTimeLikeType | string
}

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
    amount: Duration | DurationLikeType | string,
    options?: RelativeOptionsType
  ): Duration {
    const other = amount instanceof Duration ? amount : Duration.from(amount)

    if (options?.relativeTo) {
      const start =
        options.relativeTo instanceof PlainDateTime
          ? options.relativeTo
          : PlainDateTime.from(options.relativeTo)
      return start.add(this).add(other).since(start)
    } else if (
      this.years ||
      this.months ||
      this.weeks ||
      other.years ||
      other.months ||
      other.weeks
    )
      throw new Error('relativeTo is required for date units')

    const {
      deltaDays,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = balanceTime(
      extractTimeMs({
        isoHour: this.hours + other.hours,
        isoMinute: this.minutes + other.minutes,
        isoSecond: this.seconds + other.seconds,
        isoMillisecond: this.milliseconds + other.milliseconds,
      })
    )
    return new Duration(
      0,
      0,
      0,
      this.days + other.days + deltaDays,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond
    )
  }
  subtract(
    amount: Duration | DurationLikeType | string,
    options?: RelativeOptionsType
  ): Duration {
    const other = amount instanceof Duration ? amount : Duration.from(amount)
    return this.add(other.negated(), options)
  }
  total({
    unit,
    relativeTo = new PlainDateTime(1970, 1, 1),
  }: UnitOptionsType & RelativeOptionsType): number {
    const relative =
      relativeTo instanceof PlainDateTime
        ? relativeTo
        : PlainDateTime.from(relativeTo)

    // FIXME: This doesn't properly account for weeks/months/years
    return (
      (relative.add(this).epochMilliseconds - relative.epochMilliseconds) /
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
    } = balanceTime(
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

  toString(): string {
    const [year, month, week, day, hour, minute, second] = [
      [this.years, 'Y'],
      [this.months, 'M'],
      [this.weeks, 'W'],
      [this.days, 'D'],
      [this.hours, 'H'],
      [this.minutes, 'M'],
      [this.seconds + this.milliseconds / UNIT_INCREMENT.SECOND, 'S'],
    ].map(([number, unit]) => ({
      negative: number < 0,
      format: number ? `${Math.abs(number as number)}${unit}` : '',
    }))

    const T = hour.format || minute.format || second.format ? 'T' : ''
    const P =
      year.negative ||
      month.negative ||
      week.negative ||
      day.negative ||
      hour.negative ||
      minute.negative ||
      second.negative
        ? '-'
        : ''

    const result = `P${year.format}${month.format}${week.format}${day.format}${T}${hour.format}${minute.format}${second.format}`
    return result === 'P' ? 'P0D' : `${P}${result}`
  }
  toLocaleString(
    locale: LocaleType,
    options?: Intl.RelativeTimeFormatOptions
  ): string {
    // TODO: This needs a proper implementation
    return new Intl.RelativeTimeFormat(locale, options).format(
      this.total({ unit: 'seconds' }),
      'seconds'
    )
  }
}
