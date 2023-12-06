
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
