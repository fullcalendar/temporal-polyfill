import {
  CalendarDisplay,
  Direction,
  EpochDisambig,
  OffsetDisambig,
  OffsetDisplay,
  Overflow,
  RoundingModeEnum,
  TimeZoneDisplay,
} from './optionsModel'
import {
  roundExpand,
  roundHalfCeil,
  roundHalfEven,
  roundHalfExpand,
  roundHalfFloor,
  roundHalfTrunc,
} from './utils'

/*
Static option names, string-to-enum maps, and enum-indexed config tables.

Nothing in this file reads user objects or performs coercion. Keeping it pure
data makes it safe to share between the option normalizers, coercers, and
call-site-specific refinement functions.
*/

export const smallestUnitStr = 'smallestUnit'
export const largestUnitStr = 'largestUnit'
export const totalUnitStr = 'unit'
export const roundingModeName = 'roundingMode'
export const roundingIncName = 'roundingIncrement'
export const subsecDigitsName = 'fractionalSecondDigits'
export const relativeToName = 'relativeTo'
export const directionName = 'direction'

export const overflowMap = {
  constrain: Overflow.Constrain,
  reject: Overflow.Reject,
}

export const epochDisambigMap = {
  compatible: EpochDisambig.Compat,
  reject: EpochDisambig.Reject,
  earlier: EpochDisambig.Earlier,
  later: EpochDisambig.Later,
}

export const offsetDisambigMap = {
  reject: OffsetDisambig.Reject,
  use: OffsetDisambig.Use,
  prefer: OffsetDisambig.Prefer,
  ignore: OffsetDisambig.Ignore,
}

export const calendarDisplayMap = {
  auto: CalendarDisplay.Auto,
  never: CalendarDisplay.Never,
  critical: CalendarDisplay.Critical,
  always: CalendarDisplay.Always,
}

export const timeZoneDisplayMap = {
  auto: TimeZoneDisplay.Auto,
  never: TimeZoneDisplay.Never,
  critical: TimeZoneDisplay.Critical,
}

export const offsetDisplayMap = {
  auto: OffsetDisplay.Auto,
  never: OffsetDisplay.Never,
}

// Keep this map in sync with RoundingModeEnum in optionsModel.
export const roundingModeMap = {
  floor: RoundingModeEnum.Floor,
  halfFloor: RoundingModeEnum.HalfFloor,
  ceil: RoundingModeEnum.Ceil,
  halfCeil: RoundingModeEnum.HalfCeil,
  trunc: RoundingModeEnum.Trunc,
  halfTrunc: RoundingModeEnum.HalfTrunc,
  expand: RoundingModeEnum.Expand,
  halfExpand: RoundingModeEnum.HalfExpand,
  halfEven: RoundingModeEnum.HalfEven,
}

// Keep this table index-aligned with RoundingModeEnum in optionsModel.
export const roundingModeFuncs = [
  Math.floor,
  roundHalfFloor,
  Math.ceil,
  roundHalfCeil,
  Math.trunc,
  roundHalfTrunc,
  roundExpand,
  roundHalfExpand,
  roundHalfEven,
]

export const directionMap = {
  previous: Direction.Previous,
  next: Direction.Next,
}
