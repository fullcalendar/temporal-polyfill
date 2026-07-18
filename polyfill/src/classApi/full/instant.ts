import type { Temporal } from 'temporal-spec'
import { InstantBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from '../../apiHelpers/classStyle'
import { bigNanoInMilli } from '../../internal/bigNano'
import { requireNumberIsInteger, toBigInt } from '../../internal/cast'
import { compareZonedEpochSlots, instantsEqual } from '../../internal/compare'
import {
  epochMilliToInstant,
  epochNanoToInstant,
  instantToZonedDateTime,
} from '../../internal/convert'
import { diffInstants } from '../../internal/diff'
import { negateDurationFields } from '../../internal/durationMath'
import { transformInstantOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { formatInstantIso } from '../../internal/isoFormat'
import { parseInstant } from '../../internal/isoParse'
import { moveEpochNano } from '../../internal/move'
import { RoundingModeEnum } from '../../internal/optionsModel'
import { refineRoundingOptions } from '../../internal/optionsRoundingRefine'
import {
  computeBigNanoInc,
  roundBigNanoToDayOriginInc,
} from '../../internal/round'
import {
  EpochNanoFields,
  createEpochNanoSlots,
  getEpochMilli,
  getEpochNano,
} from '../../internal/slots'
import { checkEpochNanoInBounds } from '../../internal/temporalLimits'
import { queryTimeZone } from '../../internal/timeZone'
import { TimeUnit, Unit } from '../../internal/units'
import { NumberSign, isObjectLike } from '../../internal/utils'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import {
  ZonedDateTime,
  createZonedDateTime,
  getZonedDateTimeSlotsIfPresent,
} from './zonedDateTime'

export type InstantArg = Instant | string

const instantSlotsMap = new WeakMap<object, EpochNanoFields>()

export type Instant = InstanceType<typeof Instant>
export const Instant = defineTemporalClass(
  InstantBranding,
  class {
    constructor(epochNanoseconds: bigint) {
      const epochNano = checkEpochNanoInBounds(toBigInt(epochNanoseconds))
      initInstant(this, createEpochNanoSlots(epochNano))
    }

    static from(arg: InstantArg): Instant {
      return createInstant(toInstantSlots(arg))
    }

    static fromEpochMilliseconds(epochMilli: number): Instant {
      return createInstant(epochMilliToInstant(epochMilli))
    }

    static fromEpochNanoseconds(epochNano: bigint): Instant {
      return createInstant(epochNanoToInstant(epochNano))
    }

    static compare(a: InstantArg, b: InstantArg): NumberSign {
      return compareZonedEpochSlots(toInstantSlots(a), toInstantSlots(b))
    }

    get epochMilliseconds(): number {
      return getEpochMilli(getInstantSlots(this))
    }

    get epochNanoseconds(): bigint {
      return getEpochNano(getInstantSlots(this))
    }

    add(durationArg: DurationArg): Instant {
      const slots = getInstantSlots(this)
      return createInstant(
        createEpochNanoSlots(
          moveEpochNano(slots.epochNanoseconds, toDurationSlots(durationArg)),
        ),
      )
    }

    subtract(durationArg: DurationArg): Instant {
      const slots = getInstantSlots(this)
      return createInstant(
        createEpochNanoSlots(
          moveEpochNano(
            slots.epochNanoseconds,
            negateDurationFields(toDurationSlots(durationArg)),
          ),
        ),
      )
    }

    until(
      otherArg: InstantArg,
      options:
        | Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
        | undefined = undefined,
    ): Duration {
      return createDuration(
        diffInstants(
          false,
          getInstantSlots(this),
          toInstantSlots(otherArg),
          options,
        ),
      )
    }

    since(
      otherArg: InstantArg,
      options:
        | Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
        | undefined = undefined,
    ): Duration {
      return createDuration(
        diffInstants(
          true,
          getInstantSlots(this),
          toInstantSlots(otherArg),
          options,
        ),
      )
    }

    round(
      options:
        | Temporal.PluralizeUnit<Temporal.TimeUnit>
        | Temporal.RoundingOptions<Temporal.TimeUnit>,
    ): Instant {
      const slots = getInstantSlots(this)
      const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
        options,
        Unit.Hour,
        true, // solarMode
      ) as [TimeUnit, number, RoundingModeEnum]
      return createInstant(
        createEpochNanoSlots(
          roundBigNanoToDayOriginInc(
            slots.epochNanoseconds,
            computeBigNanoInc(smallestUnit, roundingInc),
            roundingMode,
          ),
        ),
      )
    }

    equals(otherArg: InstantArg): boolean {
      return instantsEqual(getInstantSlots(this), toInstantSlots(otherArg))
    }

    toZonedDateTimeISO(timeZoneArg: TimeZoneArg): ZonedDateTime {
      return createZonedDateTime(
        instantToZonedDateTime(
          getInstantSlots(this),
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        ),
      )
    }

    toLocaleString(
      locales: LocalesArg | undefined = undefined,
      options: Intl.DateTimeFormatOptions = {},
    ): string {
      const slots = getInstantSlots(this)
      const format = new RawDateTimeFormat(
        locales,
        transformInstantOptions(options),
      )
      return format.format(getEpochMilli(slots))
    }

    toString(
      options: Temporal.InstantToStringOptions | undefined = undefined,
    ): string {
      return formatInstantIso(refineTimeZoneArg, getInstantSlots(this), options)
    }

    toJSON(): string {
      return formatInstantIso(refineTimeZoneArg, getInstantSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
)

export function createInstant(slots: EpochNanoFields): Instant {
  return initInstant(Object.create(Instant.prototype), slots)
}

export function getInstantSlots(obj: unknown): EpochNanoFields {
  return getInstantSlotsIfPresent(obj) || invalidRecordType()
}

export function getInstantSlotsIfPresent(
  obj: unknown,
): EpochNanoFields | undefined {
  return instantSlotsMap.get(obj as object)
}

export function toInstantSlots(arg: InstantArg): EpochNanoFields {
  if (isObjectLike(arg)) {
    const ownSlots = getInstantSlotsIfPresent(arg)

    if (ownSlots) {
      return ownSlots
    }

    const zonedDateTimeSlots = getZonedDateTimeSlotsIfPresent(arg)

    if (zonedDateTimeSlots) {
      return createEpochNanoSlots(zonedDateTimeSlots.epochNanoseconds)
    }
  }
  return parseInstant(arg as any)
}

// Defining the function like this is best way to ensure it is
// "non-constructable" per descriptor-related test262 tests
export const { toTemporalInstant } = {
  toTemporalInstant(this: Date): Instant {
    // Will error if not Date
    const epochMilli = Date.prototype.valueOf.call(this)
    // TODO: better error message instead of "non-integer number" or whatever?
    return createInstant(
      createEpochNanoSlots(
        BigInt(requireNumberIsInteger(epochMilli)) * bigNanoInMilli,
      ),
    )
  },
}

function initInstant(instance: object, slots: EpochNanoFields): Instant {
  instantSlotsMap.set(instance, slots)
  attachDebugString(instance as Instant)
  return instance as Instant
}
