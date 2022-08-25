import { Temporal } from 'temporal-spec'
import { parseDiffOptions } from '../argParse/diffOptions'
import { OVERFLOW_REJECT } from '../argParse/overflowHandling'
import { ensureOptionsObj, isObjectLike } from '../argParse/refine'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { AbstractNoValueObj, ensureObj } from '../dateUtils/abstract'
import { compareEpochObjs } from '../dateUtils/compare'
import { constrainDateTimeISO } from '../dateUtils/constrain'
import { diffEpochNanos } from '../dateUtils/diff'
import { negateDuration } from '../dateUtils/durationFields'
import { epochNanoSymbol, isoFieldsToEpochNano } from '../dateUtils/epoch'
import { validateInstant } from '../dateUtils/isoFieldValidation'
import { ComputedEpochFields, attachStringTag, mixinEpochFields } from '../dateUtils/mixins'
import { parseZonedDateTime } from '../dateUtils/parse'
import { roundEpochNano } from '../dateUtils/rounding'
import { translateEpochNano } from '../dateUtils/translate'
import {
  HOUR,
  NANOSECOND,
  SECOND,
  nanoInMicro,
  nanoInMilli,
  nanoInSecond,
} from '../dateUtils/units'
import { createZonedFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { LargeInt, LargeIntArgStrict, createLargeInt } from '../utils/largeInt'
import { Duration, createDuration } from './duration'
import { ZonedDateTime } from './zonedDateTime'

export type InstantArg = Temporal.Instant | string

type TranslateArg = Omit<
Temporal.Duration | Temporal.DurationLike,
'years' | 'months' | 'weeks' | 'days'
> | string

type DiffOptions = Temporal.DifferenceOptions<
'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
>

type RoundOptions = Temporal.RoundTo<
'hour' | 'minute' | 'second' |
'millisecond' | 'microsecond' | 'nanosecond'
>

type ToZonedDateTimeOptions = {
  timeZone: Temporal.TimeZoneLike
  calendar: Temporal.CalendarLike
}

export interface Instant {
  [epochNanoSymbol]: LargeInt
}
export class Instant extends AbstractNoValueObj implements Temporal.Instant {
  constructor(epochNanoseconds: LargeIntArgStrict) {
    super()
    const epochNano = createLargeInt(epochNanoseconds, true) // strict=true
    validateInstant(epochNano)
    this[epochNanoSymbol] = epochNano
  }

  static from(arg: InstantArg): Instant { // okay to have return-type be Instant? needed
    if (arg instanceof Instant) {
      return new Instant(arg.epochNanoseconds)
    }

    const fields = parseZonedDateTime(String(arg))
    const offsetNano = fields.offsetNanoseconds
    if (offsetNano === undefined) {
      throw new RangeError('Must specify an offset')
    }

    return new Instant(
      isoFieldsToEpochNano(constrainDateTimeISO(fields, OVERFLOW_REJECT))
        .sub(offsetNano),
    )
  }

  static fromEpochSeconds(epochSeconds: number): Temporal.Instant {
    return new Instant(createLargeInt(epochSeconds).mult(nanoInSecond))
  }

  static fromEpochMilliseconds(epochMilliseconds: number): Temporal.Instant {
    return new Instant(createLargeInt(epochMilliseconds).mult(nanoInMilli))
  }

  static fromEpochMicroseconds(epochMicroseconds: bigint): Temporal.Instant {
    return new Instant(epochMicroseconds * BigInt(nanoInMicro))
  }

  static fromEpochNanoseconds(epochNanoseconds: bigint): Temporal.Instant {
    return new Instant(epochNanoseconds)
  }

  static compare(a: InstantArg, b: InstantArg): Temporal.ComparisonResult {
    return compareEpochObjs(
      ensureObj(Instant, a),
      ensureObj(Instant, b),
    )
  }

  add(durationArg: TranslateArg): Temporal.Instant {
    return new Instant(
      translateEpochNano(this[epochNanoSymbol], ensureObj(Duration, durationArg)),
    )
  }

  subtract(durationArg: TranslateArg): Temporal.Instant {
    return new Instant(
      translateEpochNano(this[epochNanoSymbol], negateDuration(ensureObj(Duration, durationArg))),
    )
  }

  until(other: InstantArg, options?: DiffOptions): Temporal.Duration {
    return diffInstants(this, ensureObj(Instant, other), options)
  }

  since(other: InstantArg, options?: DiffOptions): Temporal.Duration {
    return diffInstants(ensureObj(Instant, other), this, options)
  }

  round(options: RoundOptions): Temporal.Instant {
    const roundingConfig = parseRoundingOptions(options, NANOSECOND, HOUR, true)

    return new Instant(
      roundEpochNano(this[epochNanoSymbol], roundingConfig),
    )
  }

  equals(other: InstantArg): boolean {
    return !compareEpochObjs(this, ensureObj(Instant, other))
  }

  toString(options?: Temporal.InstantToStringOptions): string {
    const timeZoneArg = ensureOptionsObj(options).timeZone
    const zonedDateTime = this.toZonedDateTimeISO(timeZoneArg ?? 'UTC') // TODO: don't use util!!!
    return zonedDateTime.toString({
      ...options,
      offset: timeZoneArg === undefined ? 'never' : 'auto',
      timeZoneName: 'never',
    }) + (timeZoneArg === undefined ? 'Z' : '')
  }

  toZonedDateTimeISO(timeZoneArg: Temporal.TimeZoneLike): Temporal.ZonedDateTime {
    return new ZonedDateTime(this.epochNanoseconds, timeZoneArg)
  }

  toZonedDateTime(options: ToZonedDateTimeOptions): Temporal.ZonedDateTime {
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
export interface Instant { [Symbol.toStringTag]: 'Temporal.Instant' }
export interface Instant extends ComputedEpochFields {}
export interface Instant extends ToLocaleStringMethods {}
attachStringTag(Instant, 'Instant')
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
  options: DiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions(
    options,
    SECOND,
    NANOSECOND,
    NANOSECOND,
    HOUR,
  )

  return createDuration(
    diffEpochNanos(inst0[epochNanoSymbol], inst1[epochNanoSymbol], diffConfig),
  )
}
