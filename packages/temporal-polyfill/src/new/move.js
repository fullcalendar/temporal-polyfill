import {
  durationFieldsToNano,
  durationHasDateParts,
  durationTimeFieldDefaults,
  durationTimeFieldsToIso,
  durationTimeFieldsToIsoStrict,
} from './durationFields'
import {
  epochMilliToIso,
  isoDaysInWeek,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  nanoToIsoTimeAndDay,
} from './isoMath'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import { hourIndex, milliInDay, nanoInUtcDay } from './units'
import { clamp } from './utils'

// Epoch
// -------------------------------------------------------------------------------------------------

export function moveZonedEpochNano(
  calendar,
  timeZone,
  epochNano,
  durationFields,
  overflowHandling,
) {
  const durationTimeNano = isoTimeFieldsToNano(durationTimeFieldsToIso(durationFields))

  if (!durationHasDateParts(durationFields)) {
    epochNano = epochNano.addNumber(durationTimeNano)
  } else {
    const isoDateTimeFields = zonedEpochNanoToIso(timeZone, epochNano)
    const movedIsoDateFields = calendar.dateAdd(
      isoDateTimeFields,
      {
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // time parts
      },
      overflowHandling,
    )
    const movedIsoDateTimeFields = {
      ...isoDateTimeFields, // time parts
      ...movedIsoDateFields, // date parts
    }
    epochNano = getSingleInstantFor(timeZone, movedIsoDateTimeFields)
      .addNumber(durationTimeNano)
  }

  return epochNano
}

export function moveEpochNano(epochNanoseconds, durationFields) {
  return epochNanoseconds.addNumber(durationTimeFieldsToIsoStrict(durationFields))
}

// Date & Time
// -------------------------------------------------------------------------------------------------

export function moveDateTime(
  calendar,
  isoDateTimeFields,
  durationFields,
  overflowHandling,
) {
  const [movedIsoTimeFields, dayDelta] = moveTime(isoDateTimeFields, durationFields)

  const movedIsoDateFields = calendar.dateAdd(
    isoDateTimeFields, // only date parts will be used
    {
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (zero-out so no balancing-up to days)
      days: durationFields.days + dayDelta,
    },
    overflowHandling,
  )

  return {
    ...movedIsoDateFields,
    ...movedIsoTimeFields,
  }
}

export function moveDate(calendar, isoDateFields, durationFields, overflowI) {
  let { years, months, weeks, days } = durationFields
  let epochMilli

  // convert time fields to days
  days += durationFieldsToNano(durationFields, hourIndex)
    .divTruncMod(nanoInUtcDay)[0].toNumber()

  if (years || months) {
    let [year, month, day] = calendar.queryYearMonthDay(isoDateFields)

    if (years) {
      year += years
      month = clamp(month, 1, calendar.queryMonthsInYear(year), overflowI, 'month')
    }

    if (months) {
      ([year, month] = calendar.addMonths(year, month, months))
      day = clamp(day, 1, calendar.queryDaysInMonth(year, month), overflowI, 'day')
    }

    epochMilli = calendar.queryDateStart(year, month, day)
  } else if (weeks || days) {
    epochMilli = isoToEpochMilli(isoDateFields)
  } else {
    return isoDateFields
  }

  epochMilli += (weeks * isoDaysInWeek + days) * milliInDay

  return {
    calendar,
    ...epochMilliToIso(epochMilli),
  }
}

export function moveDateByDays(isoDateFields, days) { // moveDateDays
  if (days) {
    isoDateFields = epochMilliToIso(isoToEpochMilli(isoDateFields) + days * milliInDay)
  }
  return isoDateFields
}

export function moveTime(isoTimeFields, durationFields) {
  return nanoToIsoTimeAndDay(
    isoTimeFieldsToNano(isoTimeFields) +
    isoTimeFieldsToNano(durationTimeFieldsToIsoStrict(durationFields)),
  )
}

// Calendar-related Utils
// -------------------------------------------------------------------------------------------------

export function moveByIsoMonths(year, month, monthDelta) {
  year += Math.trunc(monthDelta / isoMonthsInYear)
  month += monthDelta % isoMonthsInYear

  if (month < 1) {
    year--
    month += isoMonthsInYear
  } else if (month > isoMonthsInYear) {
    year++
    month -= isoMonthsInYear
  }

  return [year, month]
}

export function moveByIntlMonths(year, month, monthDelta, calendarImpl) {
  month += monthDelta

  if (monthDelta < 0) {
    if (month < Number.MIN_SAFE_INTEGER) {
      throw new RangeError('Months out of range')
    }
    while (month < 1) {
      month += calendarImpl.monthsInYear(--year)
    }
  } else {
    if (month > Number.MAX_SAFE_INTEGER) {
      throw new RangeError('Months out of range')
    }
    let monthsInYear
    while (month > (monthsInYear = calendarImpl.monthsInYear(year))) {
      month -= monthsInYear
      year++
    }
  }

  return [year, month]
}
