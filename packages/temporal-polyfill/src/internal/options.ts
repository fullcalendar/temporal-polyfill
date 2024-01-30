import {
  roundExpand,
  roundHalfCeil,
  roundHalfEven,
  roundHalfExpand,
  roundHalfFloor,
  roundHalfTrunc,
} from './utils'

export enum Overflow {
  Constrain = 0,
  Reject = 1,
}

export enum EpochDisambig {
  Compat = 0,
  Reject = 1,
  Earlier = 2,
  Later = 3,
}

export enum OffsetDisambig {
  Reject = 0,
  Use = 1,
  Prefer = 2,
  Ignore = 3,
}

export enum CalendarDisplay {
  Auto = 0,
  Never = 1,
  Critical = 2,
  Always = 3,
}

export enum TimeZoneDisplay {
  Auto = 0,
  Never = 1,
  Critical = 2,
}

export enum OffsetDisplay {
  Auto = 0,
  Never = 1,
}

export enum RoundingMode {
  // modes that get inverted (see invertRoundingMode)
  Floor = 0,
  HalfFloor = 1,
  Ceil = 2,
  HalfCeil = 3,
  // other modes
  Trunc = 4,
  HalfTrunc = 5,
  Expand = 6,
  HalfExpand = 7,
  HalfEven = 8,
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
