import { parseDiffOptions } from '../argParse/diffOptions'
import { OVERFLOW_REJECT } from '../argParse/overflowHandling'
import { ensureOptionsObj, isObjectLike } from '../argParse/refine'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { AbstractNoValueObj, ensureObj } from '../dateUtils/abstract'
import { compareEpochObjs } from '../dateUtils/compare'
import { constrainDateTimeISO } from '../dateUtils/constrain'
import { diffEpochNanos } from '../dateUtils/diff'
import { negateDuration } from '../dateUtils/durationFields'
import { isoFieldsToEpochNano } from '../dateUtils/epoch'
import { validateInstant } from '../dateUtils/isoFieldValidation'
import { ComputedEpochFields, mixinEpochFields } from '../dateUtils/mixins'
import { parseZonedDateTime } from '../dateUtils/parse'
import { roundEpochNano } from '../dateUtils/rounding'
import { translateEpochNano } from '../dateUtils/translate'
import {
  HOUR,
  NANOSECOND,
  SECOND,
  nanoInMicroBI,
  nanoInMilliBI,
  nanoInSecondBI,
} from '../dateUtils/units'
import { createZonedFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { createWeakMap } from '../utils/obj'
import { Duration, createDuration } from './duration'
import {
  CalendarArg,
  CompareResult,
  DurationArg,
  InstantArg,
  InstantToStringOptions,
  TimeDiffOptions,
  TimeRoundingOptions,
  TimeZoneArg,
} from './types'
import { ZonedDateTime } from './zonedDateTime'

const [getEpochNano, setEpochNano] = createWeakMap<Instant, bigint>()

export class Instant extends AbstractNoValueObj {
  constructor(epochNanoseconds: bigint) {
    super()
    if (typeof epochNanoseconds === 'number') {
      throw new TypeError('Must supply bigint, not number')
    }
    epochNanoseconds = BigInt(epochNanoseconds) // cast
    validateInstant(epochNanoseconds)
    setEpochNano(this, epochNanoseconds)
  }

  static from(arg: InstantArg): Instant {
    if (arg instanceof Instant) {
      return new Instant(arg.epochNanoseconds)
    }

    const fields = parseZonedDateTime(String(arg))
    const offsetNano = fields.offsetNanoseconds
    if (offsetNano === undefined) {
      throw new RangeError('Must specify an offset')
    }

    return new Instant(
      isoFieldsToEpochNano(constrainDateTimeISO(fields, OVERFLOW_REJECT)) -
      BigInt(offsetNano),
    )
  }

  static fromEpochSeconds(epochSeconds: number): Instant {
    return new Instant(BigInt(epochSeconds) * nanoInSecondBI)
  }

  static fromEpochMilliseconds(epochMilliseconds: number): Instant {
    return new Instant(BigInt(epochMilliseconds) * nanoInMilliBI)
  }

  static fromEpochMicroseconds(epochMicroseconds: bigint): Instant {
    return new Instant(epochMicroseconds * nanoInMicroBI)
  }

  static fromEpochNanoseconds(epochNanoseconds: bigint): Instant {
    return new Instant(epochNanoseconds)
  }

  static compare(a: InstantArg, b: InstantArg): CompareResult {
    return compareEpochObjs(
      ensureObj(Instant, a),
      ensureObj(Instant, b),
    )
  }

  get epochNanoseconds(): bigint { return getEpochNano(this) }

  add(durationArg: DurationArg): Instant {
    return new Instant(
      translateEpochNano(this.epochNanoseconds, ensureObj(Duration, durationArg)),
    )
  }

  subtract(durationArg: DurationArg): Instant {
    return new Instant(
      translateEpochNano(this.epochNanoseconds, negateDuration(ensureObj(Duration, durationArg))),
    )
  }

  until(other: InstantArg, options?: TimeDiffOptions): Duration {
    return diffInstants(this, ensureObj(Instant, other), options)
  }

  since(other: InstantArg, options?: TimeDiffOptions): Duration {
    return diffInstants(ensureObj(Instant, other), this, options)
  }

  round(options: TimeRoundingOptions): Instant {
    const roundingConfig = parseRoundingOptions(options, undefined, NANOSECOND, HOUR, true)

    return new Instant(
      roundEpochNano(this.epochNanoseconds, roundingConfig),
    )
  }

  equals(other: InstantArg): boolean {
    return !compareEpochObjs(this, ensureObj(Instant, other))
  }

  toString(options?: InstantToStringOptions): string {
    const timeZoneArg = ensureOptionsObj(options).timeZone
    const zonedDateTime = this.toZonedDateTimeISO(timeZoneArg ?? 'UTC') // TODO: don't use util!!!
    return zonedDateTime.toString({
      ...options,
      offset: timeZoneArg === undefined ? 'never' : 'auto',
      timeZoneName: 'never',
    }) + (timeZoneArg === undefined ? 'Z' : '')
  }

  toZonedDateTimeISO(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return new ZonedDateTime(this.epochNanoseconds, timeZoneArg)
  }

  toZonedDateTime(options: { calendar: CalendarArg, timeZone: TimeZoneArg }): ZonedDateTime {
    // TODO: more official options-processing utils for this
    if (!isObjectLike(options)) {
      throw new TypeError('Must specify options')
    } else if (options.calendar === undefined) {
      throw new TypeError('Must specify a calendar')
    } else if (options.timeZone === undefined) {
      throw new TypeError('Must specify a timeZone')
    }

    return new ZonedDateTime(
      this.epochNanoseconds,
      options.timeZone,
      options.calendar,
    )
  }
}

// mixins
export interface Instant extends ComputedEpochFields {}
export interface Instant extends ToLocaleStringMethods {}
mixinEpochFields(Instant)
mixinLocaleStringMethods(Instant, createZonedFormatFactoryFactory({
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: undefined,
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
}, {
  timeZoneName: undefined,
}, {}))

function diffInstants(
  inst0: Instant,
  inst1: Instant,
  options: TimeDiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions(
    options,
    SECOND,
    NANOSECOND,
    NANOSECOND,
    HOUR,
  )

  return createDuration(
    diffEpochNanos(inst0.epochNanoseconds, inst1.epochNanoseconds, diffConfig),
  )
}
