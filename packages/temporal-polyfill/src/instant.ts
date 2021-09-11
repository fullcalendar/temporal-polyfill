import { AbstractNoValueObj, ensureObj } from './dateUtils/abstract'
import { isoFieldsToEpochNano } from './dateUtils/isoMath'
import { ComputedEpochFields, mixinEpochFields } from './dateUtils/mixins'
import { parseDateTimeISO, parseOffsetNano } from './dateUtils/parse'
import { nanoInMicro, nanoInMilli, nanoInSecond } from './dateUtils/units'
import { compareValues } from './utils/math'
import { createWeakMap } from './utils/obj'
import {
  CalendarArg,
  CompareResult,
  InstantArg,
  InstantToStringOptions,
  LocalesArg,
  TimeZoneArg,
} from './args'
import { ZonedDateTime } from './zonedDateTime'

const [getEpochNano, setEpochNano] = createWeakMap<Instant, bigint>()

export class Instant extends AbstractNoValueObj {
  constructor(epochNanoseconds: bigint) {
    super()
    setEpochNano(this, epochNanoseconds)
  }

  static from(arg: InstantArg): Instant {
    if (arg instanceof Instant) {
      return new Instant(arg.epochNanoseconds)
    }

    const fields = parseDateTimeISO(String(arg))
    if (fields.offset == null) {
      throw new Error('Must specify an offset')
    }
    // TODO: detect if *time* fields are all unspecified. if so, throw error
    return new Instant(isoFieldsToEpochNano(fields) - BigInt(parseOffsetNano(fields.offset)))
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

// utils
function compareInstants(a: Instant, b: Instant): CompareResult {
  return compareValues(a.epochNanoseconds, b.epochNanoseconds)
}
