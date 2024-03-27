/*
WIP. Ultimately for funcApi
*/
import { bigNanoToNumber, compareBigNanos, diffBigNanos } from './bigNano'
import { createNativeDiffOps } from './calendarNativeQuery'
import {
  diffByDay,
  diffByWeekAndDay,
  getCommonCalendarSlot,
  getCommonTimeZoneSlot,
  zonedEpochRangeToIso,
} from './diff'
import { MarkerToEpochNano, MoveMarker } from './markerSystem'
import { moveZonedEpochSlots } from './move'
import {
  RoundingMathOptions,
  RoundingModeName,
  refineLargeRoundingOptions,
} from './optionsRefine'
import { roundBigNanoByInc, roundByInc } from './round'
import { ZonedDateTimeSlots, extractEpochNano } from './slots'
import { queryNativeTimeZone } from './timeZoneNative'
import { totalRelativeDuration } from './total'
import {
  Unit,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from './units'
import { bindArgs } from './utils'

export function zdt_diffYears(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const calendarSlot = getCommonCalendarSlot(record0.calendar, record1.calendar)
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Year,
    options,
  )

  const startEpochNano = record0.epochNanoseconds
  const endEpochNano = record1.epochNanoseconds
  const sign = compareBigNanos(endEpochNano, startEpochNano)

  if (!sign) {
    return 0
  }

  const timeZoneSlot = getCommonTimeZoneSlot(record0.timeZone, record1.timeZone)
  const timeZoneOps = queryNativeTimeZone(timeZoneSlot)
  const calendarOps = createNativeDiffOps(calendarSlot)

  const [isoFields0, isoFields1] = zonedEpochRangeToIso(
    timeZoneOps,
    sign,
    record0,
    record1,
  )
  const durationFields = calendarOps.dateUntil(
    isoFields0,
    isoFields1,
    Unit.Year,
  )

  let res = totalRelativeDuration(
    durationFields,
    endEpochNano,
    Unit.Year,
    record0,
    extractEpochNano as MarkerToEpochNano,
    bindArgs(moveZonedEpochSlots, calendarOps, timeZoneOps) as MoveMarker,
  )

  if (roundingInc) {
    res = roundByInc(res, roundingInc, roundingMode!)
  }

  return res
}

export function zdt_diffMonths(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const calendarSlot = getCommonCalendarSlot(record0.calendar, record1.calendar)
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Month,
    options,
  )

  const startEpochNano = record0.epochNanoseconds
  const endEpochNano = record1.epochNanoseconds
  const sign = compareBigNanos(endEpochNano, startEpochNano)

  if (!sign) {
    return 0
  }

  const timeZoneSlot = getCommonTimeZoneSlot(record0.timeZone, record1.timeZone)
  const timeZoneOps = queryNativeTimeZone(timeZoneSlot)
  const calendarOps = createNativeDiffOps(calendarSlot)

  const [isoFields0, isoFields1] = zonedEpochRangeToIso(
    timeZoneOps,
    sign,
    record0,
    record1,
  )
  const durationFields = calendarOps.dateUntil(
    isoFields0,
    isoFields1,
    Unit.Month,
  )

  let months = totalRelativeDuration(
    durationFields,
    endEpochNano,
    Unit.Month,
    record0,
    extractEpochNano as MarkerToEpochNano,
    bindArgs(moveZonedEpochSlots, calendarOps, timeZoneOps) as MoveMarker,
  )

  if (roundingInc) {
    months = roundByInc(months, roundingInc, roundingMode!)
  }

  return months
}

export function zdt_diffWeeks(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const calendarSlot = getCommonCalendarSlot(record0.calendar, record1.calendar)
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Week,
    options,
  )

  const startEpochNano = record0.epochNanoseconds
  const endEpochNano = record1.epochNanoseconds
  const sign = compareBigNanos(endEpochNano, startEpochNano)

  if (!sign) {
    return 0
  }

  const timeZoneSlot = getCommonTimeZoneSlot(record0.timeZone, record1.timeZone)
  const timeZoneOps = queryNativeTimeZone(timeZoneSlot)
  const calendarOps = createNativeDiffOps(calendarSlot)

  const [isoFields0, isoFields1] = zonedEpochRangeToIso(
    timeZoneOps,
    sign,
    record0,
    record1,
  )
  const durationFields = diffByWeekAndDay(isoFields0, isoFields1)

  let weeks = totalRelativeDuration(
    durationFields,
    endEpochNano,
    Unit.Week,
    record0,
    extractEpochNano as MarkerToEpochNano,
    bindArgs(moveZonedEpochSlots, calendarOps, timeZoneOps) as MoveMarker,
  )

  if (roundingInc) {
    weeks = roundByInc(weeks, roundingInc, roundingMode!)
  }

  return weeks
}

export function zdt_diffDays(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const calendarSlot = getCommonCalendarSlot(record0.calendar, record1.calendar)
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Day,
    options,
  )

  const startEpochNano = record0.epochNanoseconds
  const endEpochNano = record1.epochNanoseconds
  const sign = compareBigNanos(endEpochNano, startEpochNano)

  if (!sign) {
    return 0
  }

  const timeZoneSlot = getCommonTimeZoneSlot(record0.timeZone, record1.timeZone)
  const timeZoneOps = queryNativeTimeZone(timeZoneSlot)
  const calendarOps = createNativeDiffOps(calendarSlot)

  const [isoFields0, isoFields1] = zonedEpochRangeToIso(
    timeZoneOps,
    sign,
    record0,
    record1,
  )
  const durationFields = diffByDay(isoFields0, isoFields1)

  let days = totalRelativeDuration(
    durationFields,
    endEpochNano,
    Unit.Day,
    record0,
    extractEpochNano as MarkerToEpochNano,
    bindArgs(moveZonedEpochSlots, calendarOps, timeZoneOps) as MoveMarker,
  )

  if (roundingInc) {
    days = roundByInc(days, roundingInc, roundingMode!)
  }

  return days
}

export function zdt_diffHours(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Hour,
    options,
  )

  let nanoDiff = diffBigNanos(
    record0.epochNanoseconds,
    record1.epochNanoseconds,
  )

  if (roundingInc) {
    nanoDiff = roundBigNanoByInc(
      nanoDiff,
      nanoInHour * roundingInc,
      roundingMode!,
    )
  }

  return bigNanoToNumber(nanoDiff, nanoInHour, true) // exact
}

export function zdt_diffMinutes(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Minute,
    options,
  )

  let nanoDiff = diffBigNanos(
    record0.epochNanoseconds,
    record1.epochNanoseconds,
  )

  if (roundingInc) {
    nanoDiff = roundBigNanoByInc(
      nanoDiff,
      nanoInMinute * roundingInc,
      roundingMode!,
    )
  }

  return bigNanoToNumber(nanoDiff, nanoInMinute, true) // exact
}

export function zdt_diffSeconds(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Second,
    options,
  )

  let nanoDiff = diffBigNanos(
    record0.epochNanoseconds,
    record1.epochNanoseconds,
  )

  if (roundingInc) {
    nanoDiff = roundBigNanoByInc(
      nanoDiff,
      nanoInSec * roundingInc,
      roundingMode!,
    )
  }

  return bigNanoToNumber(nanoDiff, nanoInSec, true) // exact
}

export function zdt_diffMilliseconds(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Millisecond,
    options,
  )

  let nanoDiff = diffBigNanos(
    record0.epochNanoseconds,
    record1.epochNanoseconds,
  )

  if (roundingInc) {
    nanoDiff = roundBigNanoByInc(
      nanoDiff,
      nanoInMilli * roundingInc,
      roundingMode!,
    )
  }

  return bigNanoToNumber(nanoDiff, nanoInMilli, true) // exact
}

export function zdt_diffMicroseconds(
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const [roundingInc, roundingMode] = refineLargeRoundingOptions(
    Unit.Microsecond,
    options,
  )

  let nanoDiff = diffBigNanos(
    record0.epochNanoseconds,
    record1.epochNanoseconds,
  )

  if (roundingInc) {
    nanoDiff = roundBigNanoByInc(
      nanoDiff,
      nanoInMicro * roundingInc,
      roundingMode!,
    )
  }

  return bigNanoToNumber(nanoDiff, nanoInMicro, true) // exact
}
