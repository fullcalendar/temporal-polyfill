import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { bigNanoInMilli } from '../../internal/bigNano'
import { requireNumberIsInteger } from '../../internal/cast'
import { compareInstants, instantsEqual } from '../../internal/compare'
import { constructEpochNanoSlots } from '../../internal/construct'
import {
  epochMilliToInstant,
  epochNanoToInstant,
  instantToZonedDateTime,
} from '../../internal/convert'
import { diffInstants } from '../../internal/diff'
import * as errorMessages from '../../internal/errorMessages'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatInstantIso } from '../../internal/isoFormat'
import { parseInstant } from '../../internal/isoParse'
import { moveInstant } from '../../internal/move'
import type {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from '../../internal/optionsInput'
import { roundInstant } from '../../internal/round'
import {
  EpochNanoFields,
  createEpochNanoSlots,
  getEpochMilli,
  getEpochNano,
} from '../../internal/slots'
import { queryTimeZone } from '../../internal/timeZone'
import { TimeUnitName } from '../../internal/units'
import { NumberSign, isObjectLike } from '../../internal/utils'
import { prepInstantFormat } from '../intlFormatConfig'
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

export class Instant {
  constructor(epochNanoseconds: bigint) {
    initInstant(this, constructEpochNanoSlots(epochNanoseconds))
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
    return compareInstants(toInstantSlots(a), toInstantSlots(b))
  }

  get epochMilliseconds(): number {
    return getEpochMilli(getInstantSlots(this))
  }

  get epochNanoseconds(): bigint {
    return getEpochNano(getInstantSlots(this))
  }

  add(durationArg: DurationArg): Instant {
    return createInstant(
      moveInstant(false, getInstantSlots(this), toDurationSlots(durationArg)),
    )
  }

  subtract(durationArg: DurationArg): Instant {
    return createInstant(
      moveInstant(true, getInstantSlots(this), toDurationSlots(durationArg)),
    )
  }

  until(
    otherArg: InstantArg,
    options: DiffOptions<TimeUnitName> | undefined = undefined,
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
    options: DiffOptions<TimeUnitName> | undefined = undefined,
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

  round(options: TimeUnitName | RoundingOptions<TimeUnitName>): Instant {
    return createInstant(roundInstant(getInstantSlots(this), options))
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
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const [format, epochMilli] = prepInstantFormat(
      locales,
      options,
      getInstantSlots(this),
    )
    return format.format(epochMilli)
  }

  toString(options: InstantDisplayOptions | undefined = undefined): string {
    return formatInstantIso(refineTimeZoneArg, getInstantSlots(this), options)
  }

  toJSON(): string {
    return formatInstantIso(refineTimeZoneArg, getInstantSlots(this))
  }

  valueOf(): never {
    return forbiddenValueOf()
  }
}

defineTemporalClass(Instant, 'Instant')
export function createInstant(slots: EpochNanoFields): Instant {
  return initInstant(Object.create(Instant.prototype), slots)
}

export function getInstantSlots(obj: unknown): EpochNanoFields {
  // Precondition: callers only pass object-like receivers because WeakMap
  // lookup itself rejects primitives.
  const slots = instantSlotsMap.get(obj as object)

  if (!slots) {
    throw new TypeError(errorMessages.invalidCallingContext)
  }

  return slots
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

export function toTemporalInstant(this: Date): Instant {
  const epochMilli = Date.prototype.valueOf.call(this) // will error if not Date

  // TODO: better error message instead of "non-integer number" or whatever?

  return createInstant(
    createEpochNanoSlots(
      BigInt(requireNumberIsInteger(epochMilli)) * bigNanoInMilli,
    ),
  )
}

function initInstant(instance: Instant, slots: EpochNanoFields): Instant {
  instantSlotsMap.set(instance, slots)
  attachDebugString(instance, slots, (slots) =>
    formatInstantIso(refineTimeZoneArg, slots),
  )
  return instance
}
