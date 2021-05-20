import { DurationType, DurationUnitType, LocaleType } from './types'

export type DurationLikeType = Partial<DurationType>

const rawDuration = ({
  years,
  months,
  weeks,
  days,
  hours,
  minutes,
  seconds,
  milliseconds,
}: DurationLikeType) => {
  const duration = new Date(0)
  duration.setUTCFullYear(years || 0)
  duration.setUTCMonth(months || 0)
  // Deal with weeks in date
  duration.setUTCDate((days || 0) + (weeks || 0) * 7)
  duration.setUTCHours(hours || 0)
  duration.setUTCMinutes(minutes || 0)
  duration.setUTCSeconds(seconds || 0)
  duration.setUTCMilliseconds(milliseconds || 0)
  return duration.valueOf()
}

// Credit goes to DayJS
const getNumberUnitFormat = (number: number, unit: string) => {
  if (!number)
    return {
      negative: false,
      format: '',
    }
  else if (number < 0) {
    return {
      negative: true,
      format: `${Math.abs(number)}${unit}`,
    }
  }
  return {
    negative: false,
    format: `${number}${unit}`,
  }
}

export class Duration {
  private epochMilliseconds = 0

  constructor(
    // TODO: Redo the setters for this
    readonly years: number = 0,
    readonly months: number = 0,
    readonly weeks: number = 0,
    readonly days: number = 0,
    readonly hours: number = 0,
    readonly minutes: number = 0,
    readonly seconds: number = 0,
    readonly milliseconds: number = 0
  ) {
    const duration = new Date(0)
    duration.setUTCFullYear(years)
    duration.setUTCMonth(months)
    // Deal with weeks in date
    duration.setUTCDate(days + weeks * 7)
    duration.setUTCHours(hours)
    duration.setUTCMinutes(minutes)
    duration.setUTCSeconds(seconds)
    duration.setUTCMilliseconds(milliseconds)
    this.epochMilliseconds = duration.valueOf()
  }

  static from(thing: any) {
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
        ] = matches.slice(2).map((value) => Number(value))
        return new Duration(years, months, weeks, days, hours, minutes, seconds)
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
  static compare(one: Duration, two: Duration) {}

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

  add(durationLike: DurationLikeType) {
    this.epochMilliseconds += rawDuration(durationLike)
  }
  subtract(durationLike: DurationLikeType) {
    this.epochMilliseconds -= rawDuration(durationLike)
  }
  total(unit: DurationUnitType) {}

  toString() {
    const Y = getNumberUnitFormat(this.years, 'Y')
    const M = getNumberUnitFormat(this.months, 'M')
    const D = getNumberUnitFormat(this.days || 0 + (this.weeks || 0 * 7), 'D')
    const H = getNumberUnitFormat(this.hours, 'H')
    const m = getNumberUnitFormat(this.minutes, 'M')
    const S = getNumberUnitFormat(
      this.seconds || 0 + (this.milliseconds || 0 / 1000),
      'S'
    )

    const T = H.format || m.format || S.format ? 'T' : ''
    const P =
      Y.negative ||
      M.negative ||
      D.negative ||
      H.negative ||
      m.negative ||
      S.negative
        ? '-'
        : ''

    const result = `${P}P${Y.format}${M.format}${D.format}${T}${H.format}${m.format}${S.format}`
    return result === 'P' || result === '-P' ? 'P0D' : result
  }
  toLocaleString(locale: LocaleType) {}
}
