import {
  durationFieldDefaults,
  nanoToDurationFields,
  timeNanoToDurationFields,
} from './durationFields'
import { pluckIsoTimeFields } from './isoFields'
import {
  isoDaysInWeek,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  isoToEpochNano,
} from './isoMath'
import { compareLargeInts } from './largeInt'
import { moveDateByDays, moveDateTime, moveZonedEpochNano } from './move'
import { roundLargeNano, roundNano, roundRelativeDuration } from './round'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import {
  dayIndex, milliInDay,
  monthIndex,
  nanoInUtcDay,
  weekIndex,
} from './units'
import { identityFunc } from './utils'

// Dates & Times
// -------------------------------------------------------------------------------------------------

export function diffDateTimes(
  calendar, // calendarOps
  startIsoFields,
  endIsoFields,
  largestUnitIndex,
  smallestUnitIndex, // TODO: nanoDivisor
  roundingMode,
  roundingIncrement,
) {
  const startEpochNano = isoToEpochNano(startIsoFields)
  const endEpochNano = isoToEpochNano(endIsoFields)

  if (largestUnitIndex < dayIndex) {
    return diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnitIndex,
      smallestUnitIndex,
      roundingMode,
      roundingIncrement,
    )
  }

  const sign = compareLargeInts(startEpochNano, endEpochNano)
  const startTimeNano = isoTimeFieldsToNano(startIsoFields)
  const endTimeNano = isoTimeFieldsToNano(endIsoFields)
  let timeNano = endTimeNano - startTimeNano
  const timeSign = Math.sign(timeNano)
  let midIsoFields = startIsoFields

  // move start-fields forward so time-diff-sign matches date-diff-sign
  if (timeSign === -sign) {
    midIsoFields = {
      ...moveDateByDays(startIsoFields, sign),
      ...pluckIsoTimeFields(startIsoFields),
    }
    timeNano += nanoInUtcDay
  }

  const dateDiff = calendar.dateUntil(midIsoFields, endIsoFields, largestUnitIndex)
  const timeDiff = timeNanoToDurationFields(timeNano)

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff, sign },
    endEpochNano,
    largestUnitIndex,
    smallestUnitIndex,
    roundingMode,
    roundingIncrement,
    startIsoFields, // marker
    isoToEpochNano, // markerToEpochNano
    moveDateTime.bind(undefined, calendar), // moveMarker
  )
}

export function diffDates(
  calendar,
  startIsoFields,
  endIsoFields,
  largestUnitIndex,
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
) {
  if (largestUnitIndex < dayIndex) {
    return diffEpochNano(
      isoToEpochNano(startIsoFields),
      isoToEpochNano(endIsoFields),
      largestUnitIndex,
      smallestUnitIndex,
      roundingMode,
      roundingIncrement,
    )
  }

  const dateDiff = calendar.dateUntil(startIsoFields, endIsoFields, largestUnitIndex)

  return roundRelativeDuration( // TODO: return DurationInternals
    dateDiff,
    isoToEpochNano(endIsoFields),
    largestUnitIndex,
    smallestUnitIndex,
    roundingMode,
    roundingIncrement,
    startIsoFields, // marker
    isoToEpochNano, // markerToEpochNano
    calendar.dateAdd.bind(calendar), // moveMarker
  )
}

export function diffDatesExact(
  calendar,
  startIsoFields,
  endIsoFields,
  largestUnitIndex,
) {
  if (largestUnitIndex <= weekIndex) {
    let weeks = 0
    let days = diffEpochMilliByDay(
      isoToEpochMilli(startIsoFields),
      isoToEpochMilli(endIsoFields),
    )
    const sign = Math.sign(days)

    if (largestUnitIndex === weekIndex) {
      weeks = Math.trunc(days / isoDaysInWeek)
      days %= isoDaysInWeek
    }

    return { ...durationFieldDefaults, weeks, days, sign }
  }

  const yearMonthDayStart = calendar.queryYearMonthDay(startIsoFields)
  const yearMonthDayEnd = calendar.queryYearMonthDay(endIsoFields)
  let [years, months, days, sign] = diffYearMonthDay(
    calendar,
    ...yearMonthDayStart,
    ...yearMonthDayEnd,
  )

  if (largestUnitIndex === monthIndex) {
    months += calendar.queryMonthsInYearSpan(years, yearMonthDayStart[0])
    years = 0
  }

  return { ...durationFieldDefaults, years, months, days, sign }
}

export function diffTimes(
  startIsoFields,
  endIsoFields,
  largestUnitIndex,
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
) {
  const startTimeNano = isoTimeFieldsToNano(startIsoFields)
  const endTimeNano = isoTimeFieldsToNano(endIsoFields)
  const timeNano = roundNano(
    endTimeNano - startTimeNano,
    smallestUnitIndex,
    roundingMode,
    roundingIncrement,
  )

  return {
    ...durationFieldDefaults,
    ...nanoToDurationFields(timeNano, largestUnitIndex),
  }
}

// Epoch
// -------------------------------------------------------------------------------------------------

export function diffZonedEpochNano(
  calendar,
  timeZone,
  startEpochNano,
  endEpochNano,
  largestUnitIndex,
  smallestUnitIndex, // optional. internally will default to 'nanoseconds'
  roundingMode, // optional. internally will default to 'halfExpand'
  roundingIncrement, // optional. internally will default to 1
) {
  if (largestUnitIndex < dayIndex) {
    return diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnitIndex,
      smallestUnitIndex,
      roundingMode,
      roundingIncrement,
    )
  }

  const sign = compareLargeInts(startEpochNano, endEpochNano)
  const startIsoFields = zonedEpochNanoToIso(timeZone, startEpochNano)
  const startIsoTimeFields = pluckIsoTimeFields(startIsoFields)
  const endIsoFields = zonedEpochNanoToIso(timeZone, endEpochNano)
  const isoToZonedEpochNano = getSingleInstantFor.bind(undefined, timeZone)
  let midIsoFields = { ...endIsoFields, ...startIsoTimeFields }
  let midEpochNano = isoToZonedEpochNano(midIsoFields)
  const midSign = compareLargeInts(midEpochNano, endEpochNano)

  if (midSign === -sign) {
    midIsoFields = {
      ...moveDateByDays(endIsoFields, -sign),
      ...startIsoTimeFields,
    }
    midEpochNano = isoToZonedEpochNano(midIsoFields)
  }

  const dateDiff = calendar.dateUntil(startIsoFields, midIsoFields, largestUnitIndex)
  const timeDiffNano = endEpochNano.addLargeInt(midEpochNano, -1).toNumber()
  const timeDiff = timeNanoToDurationFields(timeDiffNano)

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff, sign },
    endEpochNano,
    largestUnitIndex,
    smallestUnitIndex,
    roundingMode,
    roundingIncrement,
    startEpochNano, // marker
    identityFunc, // markerToEpochNano
    moveZonedEpochNano.bind(undefined, calendar, timeZone), // moveMarker
  )
}

export function diffEpochNano(
  startEpochNano,
  endEpochNano,
  largestUnitIndex,
  smallestUnitIndex,
  roundingMode,
  roundingIncrement,
) {
  return {
    ...durationFieldDefaults,
    ...nanoToDurationFields(
      roundLargeNano(
        endEpochNano.addLargeInt(startEpochNano, -1),
        smallestUnitIndex,
        roundingMode,
        roundingIncrement,
      ),
      largestUnitIndex,
    ),
  }
}

/*
Must always be given start-of-day
*/
export function diffEpochMilliByDay(epochMilli0, epochMilli1) {
  return Math.round((epochMilli1 - epochMilli0) / milliInDay)
}

// Calendar Utils
// -------------------------------------------------------------------------------------------------

function diffYearMonthDay(calendarImpl, year0, month0, day0, year1, month1, day1) {
  let yearDiff
  let monthsInYear1
  let monthDiff
  let daysInMonth1
  let dayDiff

  function updateYearMonth() {
    yearDiff = year1 - year0
    monthsInYear1 = calendarImpl.monthsInYear(year1)
    monthDiff = month1 - Math.min(month0, monthsInYear1)
  }

  function updateYearMonthDay() {
    updateYearMonth()
    daysInMonth1 = calendarImpl.daysInMonth(year1, month1)
    dayDiff = day1 - Math.min(day0, daysInMonth1)
  }

  updateYearMonthDay()
  const daySign = Math.sign(dayDiff)
  const sign = Math.sign(yearDiff) || Math.sign(monthDiff) || daySign

  if (sign) {
    // overshooting day? correct by moving to penultimate month
    if (daySign === -sign) {
      const oldDaysInMonth1 = daysInMonth1
      ;([year1, month1] = calendarImpl.addMonths(year1, month1, -sign))
      updateYearMonthDay()
      dayDiff += sign < 0 // correct with days-in-month further in past
        ? oldDaysInMonth1 // correcting from past -> future
        : daysInMonth1 // correcting from future -> past
    }

    // overshooting month? correct by moving to penultimate year
    const monthSign = Math.sign(monthDiff)
    if (monthSign === -sign) {
      const oldMonthsInYear1 = monthsInYear1
      year1 -= sign
      updateYearMonth()
      monthDiff += sign < 0 // correct with months-in-year further in past
        ? oldMonthsInYear1 // correcting from past -> future
        : monthsInYear1 // correcting from future -> past
    }
  }

  return [yearDiff, monthDiff, dayDiff, sign]
}

export function computeIsoMonthsInYearSpan(yearDelta) {
  return yearDelta * isoMonthsInYear
}

export function computeIntlMonthsInYearSpan(yearDelta, yearStart, calendarImpl) {
  const yearEnd = yearStart + yearDelta
  const yearSign = Math.sign(yearDelta)
  const yearCorrection = yearSign < 0 ? -1 : 0
  let months = 0

  for (let year = 0; year !== yearEnd; year += yearSign) {
    months += calendarImpl.queryMonthsInYear(year + yearCorrection)
  }

  return months
}
