import { pluckIsoTimeFields } from './isoFields'
import {
  isoToEpochNano,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  nanoInUtcDay,
  nanosecondsToTimeDuration,
} from './isoMath'
import { compareLargeInts } from './largeInt'
import { addDaysToIsoFields, moveDateTime, moveZonedEpochNanoseconds } from './move'
import { roundLargeNanoseconds, roundRelativeDuration } from './round'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import { identityFunc } from './util'

export function diffDaysMilli(milli0, milli1) { // diffEpochMilliByDays
}

// Diffing
// -------------------------------------------------------------------------------------------------

export function diffEpochNanoseconds(
  startEpochNanoseconds,
  endEpochNanoseconds,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  return roundLargeNanoseconds(
    diffExactLargeNanoseconds(
      endEpochNanoseconds.subtract(startEpochNanoseconds),
      smallestUnit,
      roundingMode,
      roundingIncrement,
    ),
    largestUnit,
  )
}

export function diffZonedEpochNanoseconds(
  calendar,
  timeZone,
  startEpochNanoseconds,
  endEpochNanoseconds,
  largestUnit,
  // for createMarkerSystem's convenience
  // TODO: eventually make these universal variables defaultSmallestUnit/defaultRoundingMode
  // for input-validation
  smallestUnit = 'nanoseconds',
  roundingMode = 'halfExpand',
  roundingIncrement = 1,
) {
  if (largestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      startEpochNanoseconds,
      endEpochNanoseconds,
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }

  function isoToZoneEpochNanoseconds(isoDateTimeFields) {
    return getSingleInstantFor(timeZone, isoDateTimeFields)
  }

  const sign = compareLargeInts(startEpochNanoseconds, endEpochNanoseconds)
  const startIsoFields = zonedEpochNanoToIso(timeZone, startEpochNanoseconds)
  const startIsoTimeFields = pluckIsoTimeFields(startIsoFields)
  const endIsoFields = zonedEpochNanoToIso(timeZone, endEpochNanoseconds)
  let midIsoFields = { ...endIsoFields, ...startIsoTimeFields }
  let midEpochNanoseconds = isoToZoneEpochNanoseconds(midIsoFields)
  const midSign = compareLargeInts(midEpochNanoseconds, endEpochNanoseconds)

  if (midSign === -sign) {
    midIsoFields = {
      ...addDaysToIsoFields(endIsoFields, -sign),
      ...startIsoTimeFields,
    }
    midEpochNanoseconds = isoToZoneEpochNanoseconds(midIsoFields)
  }

  const dateDiff = calendar.dateUntil(startIsoFields, midIsoFields, largestUnit)
  const timeDiff = diffExactLargeNanoseconds(
    endEpochNanoseconds.subtract(midEpochNanoseconds),
    'hours', // largestUnit (default?)
  )

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff, sign },
    endEpochNanoseconds,
    startEpochNanoseconds, // marker
    identityFunc, // markerToEpochNanoseconds
    moveZonedEpochNanoseconds.bind(undefined, calendar, timeZone), // moveMarker
    smallestUnit,
    roundingMode,
    roundingIncrement,
    largestUnit,
  )
}

export function diffDateTimes(
  calendar,
  startIsoFields,
  endIsoFields,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const startEpochNanoseconds = isoToEpochNano(startIsoFields)
  const endEpochNanoseconds = isoToEpochNano(endIsoFields)

  if (largestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      startEpochNanoseconds,
      endEpochNanoseconds,
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }
  // TODO: what about day optimization?

  const sign = compareLargeInts(startEpochNanoseconds, endEpochNanoseconds)
  const startTimeNanoseconds = isoTimeFieldsToNano(startIsoFields) // number
  const endTimeNanoseconds = isoTimeFieldsToNano(endIsoFields) // number
  let timeNanosecondDiff = endTimeNanoseconds - startTimeNanoseconds
  const timeSign = Math.sign(timeNanosecondDiff)
  let midIsoFields = startIsoFields

  if (timeSign === -sign) {
    midIsoFields = {
      ...addDaysToIsoFields(startIsoFields, sign),
      ...pluckIsoTimeFields(startIsoFields),
    }
    timeNanosecondDiff += nanoInUtcDay
  }

  const dateDiff = calendar.dateUntil(midIsoFields, endIsoFields, largestUnit)
  const timeDiff = nanosecondsToTimeDuration(
    timeNanosecondDiff,
    'hours', // largestUnit (default?)
  )

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff, sign },
    endEpochNanoseconds,
    startIsoFields, // marker
    isoToEpochNano, // markerToEpochNanoseconds
    moveDateTime.bind(undefined, calendar), // moveMarker
    smallestUnit,
    roundingMode,
    roundingIncrement,
    largestUnit,
  )
}

export function diffDates(
  calendar,
  startIsoDateFields,
  endIsoDateFields,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  if (largestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      isoToEpochNano(startIsoDateFields),
      isoToEpochNano(endIsoDateFields),
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }

  const dateDiff = calendar.dateUntil(startIsoDateFields, endIsoDateFields, largestUnit)

  return roundRelativeDuration(
    dateDiff,
    isoToEpochNano(endIsoDateFields),
    startIsoDateFields, // marker
    isoToEpochNano, // markerToEpochNanoseconds
    calendar.dateAdd.bind(calendar), // moveMarker
    smallestUnit,
    roundingMode,
    roundingIncrement,
    largestUnit,
  )
}

export function diffTimes() {

}

// CalendarImpl Utils
// -------------------------------------------------------------------------------------------------

export function diffYearMonthDay(year0, month0, day0, year1, month1, day1, calendarImpl) {
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
    // overshooting day? - correct by moving to penultimate month
    if (daySign && daySign !== sign) {
      const oldDaysInMonth1 = daysInMonth1
      ;([year1, month1] = calendarImpl.addMonths(year1, month1, -sign))
      updateYearMonthDay()
      dayDiff += sign < 0 // correct with days-in-month further in past
        ? oldDaysInMonth1 // correcting from past -> future
        : daysInMonth1 // correcting from future -> past
    }

    // overshooting month? - correct by moving to penultimate year
    const monthSign = Math.sign(monthDiff)
    if (monthSign && monthSign !== sign) {
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

export function computeIsoMonthsInYearSpan(isoYearStart, yearDelta) {
  return yearDelta * isoMonthsInYear
}

export function computeIntlMonthsInYearSpan(yearStart, yearDelta, calendarImpl) {
  const yearEnd = yearStart + yearDelta
  const yearSign = Math.sign(yearDelta)
  const yearCorrection = yearSign < 0 ? -1 : 0
  let months = 0

  for (let year = 0; year !== yearEnd; year += yearSign) {
    months += calendarImpl.queryMonthsInYear(year + yearCorrection)
  }

  return months
}

// Exact Diffing
// -------------------------------------------------------------------------------------------------

function diffExactLargeNanoseconds(
  nanoseconds,
  largestUnit,
) {
}
