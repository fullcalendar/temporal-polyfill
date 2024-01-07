import { roundExpand, roundHalfCeil, roundHalfEven, roundHalfExpand, roundHalfFloor, roundHalfTrunc } from './utils'

export const enum Overflow {
  Constrain,
  Reject
}

export const enum EpochDisambig {
  Compat,
  Reject,
  Earlier,
  Later
}

export const enum OffsetDisambig {
  Reject,
  Use,
  Prefer,
  Ignore
}

export const enum CalendarDisplay {
  Auto,
  Never,
  Critical,
  Always
}

export const enum TimeZoneDisplay {
  Auto,
  Never,
  Critical
}

export const enum OffsetDisplay {
  Auto,
  Never
}

export const enum RoundingMode {
  // modes that get inverted (see invertRoundingMode)
  Floor,
  HalfFloor,
  Ceil,
  HalfCeil,
  // other modes
  Trunc,
  HalfTrunc,
  Expand,
  HalfExpand,
  HalfEven
}

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

export type SubsecDigits = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/*
common SubsecDigits addons:
  -1 means hide seconds
  undefined means 'auto' (display all digits but no trailing zeros)
*/
