import { toInteger, toString } from './cast'
import { DurationFieldName, durationFieldIndexes } from './durationFields'
import * as errorMessages from './errorMessages'
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
} from './optionsConfig'
import { Overflow, SubsecDigits } from './optionsModel'
import type {
  CalendarDisplayOptions,
  DirectionOptions,
  EpochDisambigOptions,
  LargestUnitOptions,
  OffsetDisambigOptions,
  OffsetDisplayOptions,
  OverflowOptions,
  RoundingModeOptions,
  SmallestUnitOptions,
  TimeZoneDisplayOptions,
  TotalUnitOptions,
} from './optionsModel'
import { StrictUnitName, Unit, UnitName, unitNameMap } from './units'
import { bindArgs, clampEntity } from './utils'

/*
Single-option coercion.

The helpers here read one already-normalized option bag property, coerce that
property into an internal enum/unit/value, and leave relationship checks to
`optionsValidate`. The higher-level `refine*Options` functions decide when each
helper is called, preserving observable property order.
*/

export function coerceRoundingIncInteger(options: {
  roundingIncrement?: number
}): number {
  const roundingInc = options[roundingIncName]
  if (roundingInc === undefined) {
    return 1
  }
  return toInteger(roundingInc, roundingIncName)
}

export function coerceFractionalSecondDigits(options: {
  fractionalSecondDigits?: SubsecDigits
}): SubsecDigits | undefined {
  let subsecDigits = options[subsecDigitsName]

  if (subsecDigits !== undefined) {
    if (typeof subsecDigits !== 'number') {
      if (toString(subsecDigits) === 'auto') {
        return
      }
      throw new RangeError(
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

/*
`null` means 'auto'
TODO: create better type where if ensureDefined, then return-type is non null/defined
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

  let unit = unitNameMap[unitStr as StrictUnitName]

  if (unit === undefined) {
    unit = durationFieldIndexes[unitStr as DurationFieldName]
  }
  if (unit === undefined) {
    throw new RangeError(
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
    throw new RangeError(
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
  coerceUnitOption<SmallestUnitOptions<UnitName>>,
  smallestUnitStr,
)
// generic. callers should type-narrow the results
export const coerceLargestUnit = bindArgs(
  coerceUnitOption<LargestUnitOptions<UnitName>>,
  largestUnitStr,
)
export const coerceTotalUnit = bindArgs(
  coerceUnitOption<TotalUnitOptions>,
  totalUnitStr,
)
export const coerceOverflow = bindArgs(
  coerceChoiceOption<OverflowOptions>,
  'overflow',
  overflowMap,
)
export const coerceEpochDisambig = bindArgs(
  coerceChoiceOption<EpochDisambigOptions>,
  'disambiguation',
  epochDisambigMap,
)
export const coerceOffsetDisambig = bindArgs(
  coerceChoiceOption<OffsetDisambigOptions>,
  'offset',
  offsetDisambigMap,
)
export const coerceCalendarDisplay = bindArgs(
  coerceChoiceOption<CalendarDisplayOptions>,
  'calendarName',
  calendarDisplayMap,
)
export const coerceTimeZoneDisplay = bindArgs(
  coerceChoiceOption<TimeZoneDisplayOptions>,
  'timeZoneName',
  timeZoneDisplayMap,
)
export const coerceOffsetDisplay = bindArgs(
  coerceChoiceOption<OffsetDisplayOptions>,
  'offset',
  offsetDisplayMap,
)
// Caller should always supply default.
export const coerceRoundingMode = bindArgs(
  coerceChoiceOption<RoundingModeOptions>,
  roundingModeName,
  roundingModeMap,
)
export const coerceDirection = bindArgs(
  coerceChoiceOption<DirectionOptions>,
  directionName,
  directionMap,
)
