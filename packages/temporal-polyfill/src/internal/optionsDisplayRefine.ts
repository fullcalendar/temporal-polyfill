import {
  coerceCalendarDisplay,
  coerceOffsetDisplay,
  coerceRoundingMode,
  coerceSmallestUnit,
  coerceSubsecDigits,
  coerceTimeZoneDisplay,
} from './optionsCoerce'
import { smallestUnitStr } from './optionsConfig'
import { CalendarDisplay, RoundingMode, SubsecDigits } from './optionsModel'
import type {
  CalendarDisplayOptions,
  DateTimeDisplayOptions,
  DateTimeDisplayTuple,
  InstantDisplayOptions,
  InstantDisplayTuple,
  TimeDisplayOptions,
  TimeDisplayTuple,
  ZonedDateTimeDisplayOptions,
  ZonedDateTimeDisplayTuple,
} from './optionsModel'
import { normalizeOptions } from './optionsNormalize'
import { validateUnitRange } from './optionsValidate'
import { TimeUnit, Unit, unitNanoMap } from './units'

/*
Display/toString option refinement.

These functions are the option-reading boundary for ISO string formatting.
They keep Temporal's observable read order local to the relevant toString-style
operations, while using the generic option coercion and validation helpers.
*/

function refineTimeDisplayTuple(
  options: TimeDisplayOptions,
  maxSmallestUnit: TimeUnit = Unit.Minute,
): TimeDisplayTuple {
  // alphabetical
  const subsecDigits = coerceSubsecDigits(options) // "fractionalSecondDigits". rename in our code?
  const roundingMode = coerceRoundingMode(options, RoundingMode.Trunc)
  const smallestUnit = coerceSmallestUnit(options)

  const unitDisplayTuple = resolveSmallestUnitAndSubsecDigits(
    validateUnitRange(
      smallestUnitStr,
      smallestUnit,
      Unit.Nanosecond,
      maxSmallestUnit,
    ),
    subsecDigits,
  )

  // Avoid tuple spread; it observes Array.prototype[Symbol.iterator].
  return [roundingMode, unitDisplayTuple[0], unitDisplayTuple[1]]
}

export function refineDateTimeDisplayOptions(
  options: DateTimeDisplayOptions | undefined,
): DateTimeDisplayTuple {
  options = normalizeOptions(options)

  // Temporal.PlainDateTime.prototype.toString reads calendarName before the
  // time precision options. Keep this coercion outside refineTimeDisplayTuple
  // so validation inside the time tuple cannot throw before calendarName has
  // been observed.
  const calendarDisplay = coerceCalendarDisplay(options)
  const timeDisplayTuple = refineTimeDisplayTuple(options)

  // Avoid tuple spread; it observes Array.prototype[Symbol.iterator].
  return [
    calendarDisplay,
    timeDisplayTuple[0],
    timeDisplayTuple[1],
    timeDisplayTuple[2],
  ]
}

export function refineDateDisplayOptions(
  options: CalendarDisplayOptions | undefined,
): CalendarDisplay {
  return coerceCalendarDisplay(normalizeOptions(options))
}

export function refineTimeDisplayOptions(
  options: TimeDisplayOptions | undefined,
  maxSmallestUnit?: TimeUnit,
): TimeDisplayTuple {
  return refineTimeDisplayTuple(normalizeOptions(options), maxSmallestUnit)
}

export function refineZonedDateTimeDisplayOptions(
  options: ZonedDateTimeDisplayOptions | undefined,
): ZonedDateTimeDisplayTuple {
  options = normalizeOptions(options)

  // alphabetical
  const calendarDisplay = coerceCalendarDisplay(options)
  const subsecDigits = coerceSubsecDigits(options) // "fractionalSecondDigits". rename in our code?
  const offsetDisplay = coerceOffsetDisplay(options)
  const roundingMode = coerceRoundingMode(options, RoundingMode.Trunc)
  const smallestUnit = coerceSmallestUnit(options)
  const timeZoneDisplay = coerceTimeZoneDisplay(options)

  const unitDisplayTuple = resolveSmallestUnitAndSubsecDigits(
    validateUnitRange(
      smallestUnitStr,
      smallestUnit,
      Unit.Nanosecond,
      Unit.Minute,
    ),
    subsecDigits,
  )

  // Avoid tuple spread; it observes Array.prototype[Symbol.iterator].
  return [
    calendarDisplay,
    timeZoneDisplay,
    offsetDisplay,
    roundingMode,
    unitDisplayTuple[0],
    unitDisplayTuple[1],
  ]
}

export function refineInstantDisplayOptions(
  options: InstantDisplayOptions | undefined,
): InstantDisplayTuple {
  options = normalizeOptions(options)

  // alphabetical
  const subsecDigits = coerceSubsecDigits(options) // "fractionalSecondDigits". rename in our code?
  const roundingMode = coerceRoundingMode(options, RoundingMode.Trunc)
  const smallestUnit = coerceSmallestUnit(options)
  const timeZoneArg: string | undefined = options.timeZone

  const unitDisplayTuple = resolveSmallestUnitAndSubsecDigits(
    validateUnitRange(
      smallestUnitStr,
      smallestUnit,
      Unit.Nanosecond,
      Unit.Minute,
    ),
    subsecDigits,
  )

  // Avoid tuple spread; it observes Array.prototype[Symbol.iterator].
  return [timeZoneArg, roundingMode, unitDisplayTuple[0], unitDisplayTuple[1]]
}

function resolveSmallestUnitAndSubsecDigits(
  smallestUnit: Unit | undefined | null,
  subsecDigits: SubsecDigits | undefined,
): [nanoInc: number, subsecDigits: SubsecDigits | -1 | undefined] {
  if (smallestUnit != null) {
    return [
      unitNanoMap[smallestUnit],
      smallestUnit < Unit.Minute
        ? ((9 - smallestUnit * 3) as SubsecDigits)
        : -1, // hide seconds (not relevant when maxSmallestUnit is smaller then minute)
    ]
  }

  return [
    subsecDigits === undefined ? 1 : 10 ** (9 - subsecDigits),
    subsecDigits,
  ]
}
