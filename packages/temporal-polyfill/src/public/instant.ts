import { AbstractNoValueObj, ensureObj } from '../dateUtils/abstract'
import { addToInstant, compareInstants, diffInstants, roundInstant } from '../dateUtils/instant'
import { isoFieldsToEpochNano, validateInstant } from '../dateUtils/isoMath'
import { ComputedEpochFields, mixinEpochFields } from '../dateUtils/mixins'
import { parseDateTimeISO } from '../dateUtils/parse'
import { nanoInMicro, nanoInMilli, nanoInSecond } from '../dateUtils/units'
import { createWeakMap } from '../utils/obj'
import { Duration } from './duration'
import {
  CalendarArg,
  CompareResult,
  DurationArg,
  InstantArg,
  InstantToStringOptions,
  LocalesArg,
  TimeDiffOptions,
  TimeRoundOptions,
  TimeZoneArg,
} from './types'
import { ZonedDateTime } from './zonedDateTime'

const [getEpochNano, setEpochNano] = createWeakMap<Instant, bigint>()

export class Instant extends AbstractNoValueObj {
  constructor(epochNanoseconds: bigint) {
    super()
    epochNanoseconds = BigInt(epochNanoseconds)
    validateInstant(epochNanoseconds)
    setEpochNano(this, epochNanoseconds)
  }

  static from(arg: InstantArg): Instant {
    if (arg instanceof Instant) {
      return new Instant(arg.epochNanoseconds)
    }

    const fields = parseDateTimeISO(String(arg))
    const offsetNano = fields.offset
    if (offsetNano == null) {
      throw new Error('Must specify an offset')
    }

    return new Instant(isoFieldsToEpochNano(fields) - BigInt(offsetNano))
  }

  static fromEpochSeconds(epochSeconds: number): Instant {
    return new Instant(BigInt(epochSeconds) * BigInt(nanoInSecond))
  }

  static fromEpochMilliseconds(epochMilliseconds: number): Instant {
    return new Instant(BigInt(epochMilliseconds) * BigInt(nanoInMilli))
  }

  static fromEpochMicroseconds(epochMicroseconds: bigint): Instant {
    return new Instant(epochMicroseconds * BigInt(nanoInMicro))
  }

  static fromEpochNanoseconds(epochNanoseconds: bigint): Instant {
    return new Instant(epochNanoseconds)
  }

  static compare(a: InstantArg, b: InstantArg): CompareResult {
    return compareInstants(
      ensureObj(Instant, a),
      ensureObj(Instant, b),
    )
  }

  get epochNanoseconds(): bigint { return getEpochNano(this) }

  add(durationArg: DurationArg): Instant {
    return addToInstant(this, ensureObj(Duration, durationArg))
  }

  subtract(durationArg: DurationArg): Instant {
    return addToInstant(this, ensureObj(Duration, durationArg).negated())
  }

  until(other: InstantArg, options?: TimeDiffOptions): Duration {
    return diffInstants(this, ensureObj(Instant, other), options)
  }

  since(other: InstantArg, options?: TimeDiffOptions): Duration {
    return diffInstants(ensureObj(Instant, other), this, options)
  }

  round(options: TimeRoundOptions): Instant {
    return roundInstant(this, options)
  }

  equals(other: InstantArg): boolean {
    return compareInstants(this, ensureObj(Instant, other)) === 0
  }

  toString(options?: InstantToStringOptions): string {
    return this.toZonedDateTimeISO(options?.timeZone ?? 'UTC').toString(options)
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    // TODO: inject more options to ensure time is displayed by default
    return new Intl.DateTimeFormat(locales, options).format(this.epochMilliseconds)
  }

  toZonedDateTimeISO(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return new ZonedDateTime(this.epochNanoseconds, timeZoneArg)
  }

  toZonedDateTime(options: { calendar: CalendarArg, timeZone: TimeZoneArg }): ZonedDateTime {
    return new ZonedDateTime(
      this.epochNanoseconds,
      options.timeZone,
      options.calendar,
    )
  }
}

// mixins
export interface Instant extends ComputedEpochFields {}
mixinEpochFields(Instant)
