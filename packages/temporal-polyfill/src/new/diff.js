import { isoMonthsInYear } from './calendarImpl'
import { addDaysToIsoFields, pluckIsoTimeFields } from './isoFields'
import { compareLargeInts } from './largeInt'
import { nanosecondsInDay } from './nanoseconds'

// Diffing & Rounding
// -------------------------------------------------------------------------------------------------

export function diffEpochNanoseconds(
  startEpochNanoseconds,
  endEpochNanoseconds,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  return diffExactLargeNanoseconds(
    roundLargeNanoseconds(
      endEpochNanoseconds.subtract(startEpochNanoseconds),
      smallestUnit,
      roundingMode,
      roundingIncrement,
    ),
    largestUnit,
  )
}

export function diffZonedEpochNanoseconds(
  startEpochNanoseconds,
  endEpochNanoseconds,
  timeZone,
  calendar,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  if (smallestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      startEpochNanoseconds,
      endEpochNanoseconds,
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }

  function isoToZoneEpochNanoseconds(isoFields) {
    return isoToEpochNanoseconds(isoFields, timeZone)
  }

  const sign = compareLargeInts(startEpochNanoseconds, endEpochNanoseconds)
  const startIsoFields = epochNanosecondsToIso(startEpochNanoseconds, timeZone)
  const startIsoTimeFields = pluckIsoTimeFields(startIsoFields)
  const endIsoFields = epochNanosecondsToIso(endEpochNanoseconds, timeZone)
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
    startIsoFields,
    startEpochNanoseconds,
    endIsoFields,
    endEpochNanoseconds,
    isoToZoneEpochNanoseconds,
    calendar,
    largestUnit,
    smallestUnit,
    roundingMode,
    roundingIncrement,
  )
}

export function diffDateTimes(
  startIsoFields,
  endIsoFields,
  calendar,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const startEpochNanoseconds = isoToUtcEpochNanoseconds(startIsoFields)
  const endEpochNanoseconds = isoToUtcEpochNanoseconds(endIsoFields)

  if (smallestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      startEpochNanoseconds,
      endEpochNanoseconds,
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }

  const sign = compareLargeInts(startEpochNanoseconds, endEpochNanoseconds)
  const startTimeNanoseconds = isoTimeToNanoseconds(startIsoFields) // number
  const endTimeNanoseconds = isoTimeToNanoseconds(endIsoFields) // number
  let timeNanosecondDiff = endTimeNanoseconds - startTimeNanoseconds
  const timeSign = numberSign(timeNanosecondDiff)
  let midIsoFields = startIsoFields

  if (timeSign === -sign) {
    midIsoFields = {
      ...addDaysToIsoFields(startIsoFields, sign),
      ...pluckIsoTimeFields(startIsoFields),
    }
    timeNanosecondDiff += nanosecondsInDay
  }

  const dateDiff = calendar.dateUntil(midIsoFields, endIsoFields, largestUnit)
  const timeDiff = nanosecondsToTimeDuration(
    timeNanosecondDiff,
    'hours', // largestUnit (default?)
  )

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff, sign },
    startIsoFields,
    startEpochNanoseconds,
    endIsoFields,
    endEpochNanoseconds,
    isoToUtcEpochNanoseconds,
    calendar,
    largestUnit,
    smallestUnit,
    roundingMode,
    roundingIncrement,
  )
}

export function diffDates(
  startIsoDateFields,
  endIsoDateFields,
  calendar,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const startEpochNanoseconds = isoToUtcEpochNanoseconds(startIsoDateFields)
  const endEpochNanoseconds = isoToUtcEpochNanoseconds(endIsoDateFields)

  if (smallestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      startEpochNanoseconds,
      endEpochNanoseconds,
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }

  const dateDiff = calendar.dateUntil(startIsoDateFields, endIsoDateFields, largestUnit)

  return roundRelativeDuration(
    dateDiff,
    startIsoDateFields,
    startEpochNanoseconds,
    endIsoDateFields,
    endEpochNanoseconds,
    isoToUtcEpochNanoseconds,
    calendar,
    largestUnit,
    smallestUnit,
    roundingMode,
    roundingIncrement,
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
  const daySign = numberSign(dayDiff)
  const sign = numberSign(yearDiff) || numberSign(monthDiff) || daySign

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
    const monthSign = numberSign(monthDiff)
    if (monthSign && monthSign !== sign) {
      const oldMonthsInYear1 = monthsInYear1
      year1 -= sign
      updateYearMonth()
      monthDiff += sign < 0 // correct with months-in-year further in past
        ? oldMonthsInYear1 // correcting from past -> future
        : monthsInYear1 // correcting from future -> past
    }
  }

  return [yearDiff, monthDiff, dayDiff]
}

export function computeIsoMonthsInYearSpan(isoYearStart, yearDelta) {
  return yearDelta * isoMonthsInYear
}

export function computeIntlMonthsInYearSpan(yearStart, yearDelta, calendarImpl) {
  const yearEnd = yearStart + yearDelta
  const yearSign = numberSign(yearDelta)
  const yearCorrection = yearSign < 0 ? -1 : 0
  let months = 0

  for (let year = 0; year !== yearEnd; year += yearSign) {
    months += calendarImpl.queryMonthsInYear(year + yearCorrection)
  }

  return months
}

// Public Duration Stuff
// -------------------------------------------------------------------------------------------------

export function roundDuration(
  durationFields,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
  relativeTo,
) {

}

export function computeDurationTotal(
  durationFields,
  unit,
  relativeTo,
) {

}

// Exact Diffing
// -------------------------------------------------------------------------------------------------

function diffExactLargeNanoseconds(
  nanoseconds,
  largestUnit,
) {

}

// Rounding
// -------------------------------------------------------------------------------------------------

function roundRelativeDuration(
  durationFields,
  startIsoFields,
  startEpochNanoseconds,
  endIsoFields,
  endEpochNanoseconds,
  isoToZoneEpochNanoseconds,
  calendar,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  // TOOO: figure out edge case where time fields round up past end of zoned day,
  // and then must be rerounded with the next day's reference frame
}

function roundLargeNanoseconds(
  nanoseconds,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {

}

// Epoch/Time
// -------------------------------------------------------------------------------------------------

function isoToUtcEpochNanoseconds(isoFields) {

}

function isoTimeToNanoseconds(isoTimeFields) {

}

function nanosecondsToTimeDuration(nanoseconds) { // nanoseconds is a number

}

// TimeZone Conversions
// -------------------------------------------------------------------------------------------------

function epochNanosecondsToIso(epochNanoseconds, timeZone) {

}

function isoToEpochNanoseconds(isoFields, timeZone, disambig) {
  return isoToPossibleEpochNanoseconds(isoFields, timeZone)[0] // example
}

function isoToPossibleEpochNanoseconds(isoFields, timeZone) {

}

// Random Utils
// -------------------------------------------------------------------------------------------------

function numberSign(number) {

}
