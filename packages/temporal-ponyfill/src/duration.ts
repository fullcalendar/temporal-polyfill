import { msFor, msToIsoTime, UNIT_INCREMENT } from './convert'
import { parseDuration } from './parse'
import { PlainDateTime, PlainDateTimeLike } from './plainDateTime'
import { roundMs, RoundOptionsLike } from './round'
import { extractTimeMs, extractTimeWithDaysMs } from './separate'
import { CompareReturn, LocaleId } from './utils'

export type DurationFields = {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export type DurationLike = Partial<DurationFields>

export type DurationUnit = keyof DurationFields

export type DurationUnitNoDate = keyof Omit<DurationFields, 'years' | 'months'>

type UnitOptions = {
  unit: DurationUnit
}

type RelativeOptions = {
  relativeTo?: PlainDateTime | PlainDateTimeLike | string
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  static from(thing: any): Duration {
    if (typeof thing === 'string') {
      return parseDuration(thing)
    } else if (
      thing.years ||
      thing.months ||
      thing.weeks ||
      thing.days ||
      thing.hours ||
      thing.minutes ||
      thing.seconds ||
      thing.milliseconds
    ) {
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
    }
    throw new Error('Invalid Object')
  }

  static compare(
    one: Duration,
    two: Duration,
    {
      relativeTo = new PlainDateTime(1970, 1, 1),
    }: { relativeTo: PlainDateTime } // FIXME: It would be better to use ZonedDateTime here but it doesn't have an add method for now
  ): CompareReturn {
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
  }: DurationLike): Duration {
    return new Duration(
      typeof years === 'number' ? years : this.years,
      typeof months === 'number' ? months : this.months,
      typeof weeks === 'number' ? weeks : this.weeks,
      typeof days === 'number' ? days : this.days,
      typeof hours === 'number' ? hours : this.hours,
      typeof minutes === 'number' ? minutes : this.minutes,
      typeof seconds === 'number' ? seconds : this.seconds,
      typeof milliseconds === 'number' ? milliseconds : this.milliseconds
    )
  }

  add(
    amount: Duration | DurationLike | string,
    options?: RelativeOptions
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
    ) {
      throw new Error('relativeTo is required for date units')
    }

    // TODO We can probably also handle weeks here
    const { deltaDays, isoHour, isoMinute, isoSecond, isoMillisecond } =
      msToIsoTime(
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
    amount: Duration | DurationLike | string,
    options?: RelativeOptions
  ): Duration {
    const other = amount instanceof Duration ? amount : Duration.from(amount)
    // Defer to add function with Duration negated
    return this.add(other.negated(), options)
  }

  total({ unit, relativeTo }: UnitOptions & RelativeOptions): number {
    if (relativeTo) {
      const relative =
        relativeTo instanceof PlainDateTime
          ? relativeTo
          : PlainDateTime.from(relativeTo)

      const relativeWithDuration = relative.add(this)

      // FIXME: This doesn't properly account for weeks/months/years, msFor will error for those units
      return (
        (relativeWithDuration.epochMilliseconds - relative.epochMilliseconds) /
        msFor[unit as DurationUnitNoDate] // It is possible for unit to have date here, counter to what DurationUnitNoDate implies
      )
    } else if (this.years || this.months) {
      throw new Error('relativeTo is required for date units')
    }
    return (
      extractTimeWithDaysMs({
        isoDay: this.days + this.weeks * UNIT_INCREMENT.WEEK,
        isoHour: this.hours,
        isoMinute: this.minutes,
        isoSecond: this.seconds,
        isoMillisecond: this.milliseconds,
      }) / msFor[unit as DurationUnitNoDate]
    )
  }

  round(options?: RoundOptionsLike & RelativeOptions): Duration {
    if (options?.relativeTo) {
      const relative =
        options.relativeTo instanceof PlainDateTime
          ? options.relativeTo
          : PlainDateTime.from(options.relativeTo)
      return relative.add(this).since(relative, options)
    } else if (this.years || this.months || this.weeks) {
      throw new Error('relativeTo is required for date units')
    }

    const { deltaDays, isoHour, isoMinute, isoSecond, isoMillisecond } =
      msToIsoTime(
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
    ].map(([number, unit]) => {
      return {
        negative: number < 0,
        format: number ? `${Math.abs(number as number)}${unit}` : '',
      }
    })

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
    locale: LocaleId,
    options?: Intl.RelativeTimeFormatOptions
  ): string {
    // TODO This needs a proper implementation
    return new Intl.RelativeTimeFormat(locale, options).format(
      this.total({ unit: 'seconds' }),
      'seconds'
    )
  }
}
