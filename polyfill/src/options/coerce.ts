import type { Temporal } from 'temporal-spec'
import { toIntegerWithTrunc, toString } from '../internal/cast'
import {
  DurationFieldName,
  durationFieldNamesAsc,
} from '../internal/durationFields'
import * as errorMessages from '../internal/errorMessages'
import type {
  FractionalSecondDigits,
  SubsecDigits,
} from '../internal/temporalSpecHelpers'
import { Unit, unitNameMap } from '../internal/units'
import { bindArgs, clampEntity, throwRangeError } from '../internal/utils'
import {
  calendarDisplayMap,
  directionMap,
  directionName,
  epochDisambigMap,
  largestUnitStr,
  offsetDisambigMap,
  offsetDisplayMap,
  overflowMap,
  roundingIncName,
  roundingModeMap,
  roundingModeName,
  smallestUnitStr,
  subsecDigitsName,
  timeZoneDisplayMap,
  totalUnitStr,
} from './config'
import { Overflow } from './model'

/*
Single-option coercion.

The helpers here read one already-normalized option bag property, coerce that
property into an internal enum/unit/value, and leave relationship checks to
`validate`. The higher-level `refine*Options` functions decide when each
helper is called, preserving observable property order.
*/

export function coerceRoundingIncInteger(options: {
  roundingIncrement?: number
}): number {
  const roundingInc = options[roundingIncName]
  if (roundingInc === undefined) {
    return 1
  }
  return toIntegerWithTrunc(roundingInc, roundingIncName)
}

export function coerceFractionalSecondDigits(options: {
  fractionalSecondDigits?: FractionalSecondDigits
}): SubsecDigits | undefined {
  let subsecDigits = options[subsecDigitsName]

  if (subsecDigits !== undefined) {
    if (typeof subsecDigits !== 'number') {
      if (toString(subsecDigits) === 'auto') {
        return
      }
      throwRangeError(
        errorMessages.invalidEntity(subsecDigitsName, subsecDigits),
      )
    }

    subsecDigits = clampEntity(
      subsecDigitsName,
      Math.floor(subsecDigits),
      0,
      9,
      Overflow.Reject,
    ) as SubsecDigits
  }

  return subsecDigits
}

// The call shape of a bound unit coercer. With ensureDefined, `undefined` and
// 'auto' both become minUnit, so the result is always a Unit; otherwise `null`
// means 'auto' and `undefined` means absent.
type UnitOptionCoercer<O> = {
  (options: O, minUnit: Unit, ensureDefined: true): Unit
  (options: O, minUnit?: Unit, ensureDefined?: false): Unit | null | undefined
}

/*
`null` means 'auto'
*/
export function coerceUnitOption<O>(
  optionName: keyof O & string,
  options: O,
  minUnit: Unit = Unit.Nanosecond,
  ensureDefined?: boolean, // will return minUnit if undefined or auto
): Unit | null | undefined {
  let unitStr = options[optionName] as string | undefined
  if (unitStr === undefined) {
    return ensureDefined ? minUnit : undefined
  }

  unitStr = toString(unitStr)
  if (unitStr === 'auto') {
    return ensureDefined ? minUnit : null
  }

  let unit = unitNameMap[unitStr as keyof typeof unitNameMap]

  if (unit === undefined) {
    unit = durationFieldNamesAsc.indexOf(unitStr as DurationFieldName)
  }
  if (unit < 0) {
    throwRangeError(
      errorMessages.invalidChoice(optionName, unitStr, unitNameMap),
    )
  }

  return unit
}

export function coerceChoiceOption<O>(
  optionName: keyof O & string,
  enumNameMap: Record<string, number>,
  options: O,
  defaultChoice = 0, // TODO: improve this type?
): number {
  const enumArg = options[optionName]
  if (enumArg === undefined) {
    return defaultChoice
  }

  const enumStr = toString(enumArg as string)
  const enumNum = enumNameMap[enumStr]
  if (enumNum === undefined) {
    throwRangeError(
      errorMessages.invalidChoice(optionName, enumStr, enumNameMap),
    )
  }
  return enumNum
}

// Named single-option coercers. These are still low-level: each reads exactly
// one option property from an already-normalized bag. Higher-level refine files
// decide when to call them so observable read order remains operation-local.

// generic. callers should type-narrow the results
export const coerceSmallestUnit = bindArgs(
  coerceUnitOption<
    Temporal.RoundingOptions<Temporal.DateUnit | Temporal.TimeUnit>
  >,
  smallestUnitStr,
) as unknown as UnitOptionCoercer<
  Temporal.RoundingOptions<Temporal.DateUnit | Temporal.TimeUnit>
>
// generic. callers should type-narrow the results
export const coerceLargestUnit = bindArgs(
  coerceUnitOption<
    Temporal.RoundingOptionsWithLargestUnit<
      Temporal.DateUnit | Temporal.TimeUnit
    >
  >,
  largestUnitStr,
) as unknown as UnitOptionCoercer<
  Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit | Temporal.TimeUnit>
>
export const coerceTotalUnit = bindArgs(
  coerceUnitOption<Pick<Temporal.DurationTotalOptions, 'unit'>>,
  totalUnitStr,
) as unknown as UnitOptionCoercer<Pick<Temporal.DurationTotalOptions, 'unit'>>
export const coerceOverflow = bindArgs(
  coerceChoiceOption<Temporal.OverflowOptions>,
  'overflow',
  overflowMap,
)
export const coerceEpochDisambig = bindArgs(
  coerceChoiceOption<Temporal.DisambiguationOptions>,
  'disambiguation',
  epochDisambigMap,
)
export const coerceOffsetDisambig = bindArgs(
  coerceChoiceOption<Temporal.ZonedDateTimeFromOptions>,
  'offset',
  offsetDisambigMap,
)
export const coerceCalendarDisplay = bindArgs(
  coerceChoiceOption<Temporal.PlainDateToStringOptions>,
  'calendarName',
  calendarDisplayMap,
)
export const coerceTimeZoneDisplay = bindArgs(
  coerceChoiceOption<Temporal.ZonedDateTimeToStringOptions>,
  'timeZoneName',
  timeZoneDisplayMap,
)
export const coerceOffsetDisplay = bindArgs(
  coerceChoiceOption<Temporal.ZonedDateTimeToStringOptions>,
  'offset',
  offsetDisplayMap,
)
// Caller should always supply default.
export const coerceRoundingMode = bindArgs(
  coerceChoiceOption<
    Temporal.RoundingOptions<Temporal.DateUnit | Temporal.TimeUnit>
  >,
  roundingModeName,
  roundingModeMap,
)
export const coerceDirection = bindArgs(
  coerceChoiceOption<Temporal.TransitionOptions>,
  directionName,
  directionMap,
)
