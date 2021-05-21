import {
  DurationType,
  DurationUnitType,
  LocaleType,
  UNIT_INCREMENT,
} from './types'

export type DurationLikeType = Partial<DurationType>

const rollover = ({
  years,
  months,
  weeks,
  days,
  hours,
  minutes,
  seconds,
  milliseconds,
}: DurationType): DurationType => {
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
  //MONTHS
  years += Math.trunc(months / UNIT_INCREMENT.YEAR)
  months = Math.trunc(months % UNIT_INCREMENT.YEAR)

  return {
    years: years || 0,
    months: months || 0,
    weeks: weeks || 0,
    days: days || 0,
    hours: hours || 0,
    minutes: minutes || 0,
    seconds: seconds || 0,
    milliseconds: milliseconds || 0,
  }
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
  ) {
    const rolled = rollover({
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
    })
    this.years = rolled.years
    this.months = rolled.months
    this.weeks = rolled.weeks
    this.days = rolled.days
    this.hours = rolled.hours
    this.minutes = rolled.minutes
    this.seconds = rolled.seconds
    this.milliseconds = rolled.milliseconds
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

  add(durationLike: DurationLikeType) {}
  subtract(durationLike: DurationLikeType) {}
  total(unit: DurationUnitType) {}

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
