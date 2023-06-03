import {
  durationHasDateParts,
  durationTimeFieldDefaults,
  durationTimeFieldsToIso,
} from './durationFields'
import {
  isoMonthsInYear,
  isoTimeFieldsToNano,
  nanoToIsoTimeFields,
} from './isoMath'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'

export function addDaysMilli(epochMilli, milli) { // moveEpochMilliByDays
}
export function addDaysToIsoFields() {
  // short-circuit if nothing to add
}

export function moveEpochNanoseconds(epochNanoseconds, durationFields) {
  return epochNanoseconds.add(onlyDurationTimeFieldsToIso(durationFields))
}

export function moveZonedEpochNanoseconds(
  calendar,
  timeZone,
  epochNanoseconds,
  durationFields,
  overflowHandling,
) {
  const durationTimeNanoseconds = isoTimeFieldsToNano(
    durationTimeFieldsToIso(durationFields),
  )

  if (!durationHasDateParts(durationFields)) {
    epochNanoseconds = epochNanoseconds.add(durationTimeNanoseconds)
  } else {
    const isoDateTimeFields = zonedEpochNanoToIso(timeZone, epochNanoseconds)
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
    epochNanoseconds = getSingleInstantFor(timeZone, movedIsoDateTimeFields)
      .add(durationTimeNanoseconds)
  }

  return epochNanoseconds
}

export function moveDateTime(
  calendar,
  isoDateTimeFields,
  durationFields,
  overflowHandling,
) {
  const [movedIsoTimeFields, dayDelta] = addIsoTimeFields(
    isoDateTimeFields,
    durationTimeFieldsToIso(durationFields),
  )

  const movedIsoDateFields = calendar.dateAdd(
    isoDateTimeFields, // only date parts will be used
    {
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (must be zero so calendar doesn't round)???
      days: durationFields.days + dayDelta,
    },
    overflowHandling,
  )

  return {
    ...movedIsoDateFields,
    ...movedIsoTimeFields,
  }
}

export function moveTime(isoTimeFields, durationFields) {
  const [movedIsoTimeFields] = addIsoTimeFields(
    isoTimeFields,
    onlyDurationTimeFieldsToIso(durationFields),
  )
  return movedIsoTimeFields
}

export function addIsoMonths(year, month, monthDelta) {
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

export function addIntlMonths(year, month, monthDelta, calendarImpl) {
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

// Epoch/Time Utils
// -------------------------------------------------------------------------------------------------

function addIsoTimeFields(isoTimeFields0, isoTimeFields1) {
  return nanoToIsoTimeFields( // returns [movedIsoTimeFields, dayDelta]
    isoTimeFieldsToNano(isoTimeFields0) +
    isoTimeFieldsToNano(isoTimeFields1),
  )
}

// Utils
// -------------------------------------------------------------------------------------------------

function onlyDurationTimeFieldsToIso(durationFields) {
  if (durationHasDateParts(durationFields)) {
    throw new RangeError('Cant have date parts')
  }
  return durationTimeFieldsToIso(durationFields)
}
