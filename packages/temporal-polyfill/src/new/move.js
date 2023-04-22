import { moveDate } from './calendarAdapter'
import {
  dateToPlainYearMonth,
  plainYearMonthToPlainDate,
} from './convert'
import {
  durationHasDateParts,
  durationTimeFieldDefaults,
  durationTimeFieldsToIso,
} from './durationFields'
import { createInstant } from './instant'
import { isoTimeFieldsToNanoseconds, nanosecondsToIsoTimeFields } from './nanoseconds'
import { createPlainDateTime } from './plainDateTime'
import { createPlainTime } from './plainTime'
import { getInternals } from './temporalClass'
import {
  instantToPlainDateTimeInternals,
  plainDateTimeToEpochNanoseconds,
} from './timeZoneProtocol'

/*
!!! all sorts of confusion in this file about internals/plain
*/

// High-level objects
// -------------------------------------------------------------------------------------------------

export function moveZonedDateTimeInternals(internals, durationFields, options) {
  let { epochNanoseconds, calendar, timeZone } = internals
  const durationTimeNanoseconds = isoTimeFieldsToNanoseconds(
    durationTimeFieldsToIso(durationFields),
  )

  if (!durationHasDateParts(durationFields)) {
    epochNanoseconds = epochNanoseconds.add(durationTimeNanoseconds)
  } else {
    const plainDateTimeInternals = instantToPlainDateTimeInternals(
      timeZone,
      calendar,
      createInstant(epochNanoseconds),
    )
    const movedPlainDateInternals = moveDate(
      calendar,
      plainDateTimeInternals,
      {
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // time parts
      },
      options,
    )
    const movedPlainDateTime = createPlainDateTime({
      ...plainDateTimeInternals, // time parts
      ...movedPlainDateInternals, // date parts
    })
    epochNanoseconds = plainDateTimeToEpochNanoseconds(timeZone, movedPlainDateTime, 'compatible')
      .add(durationTimeNanoseconds)
  }

  return {
    epochNanoseconds,
    timeZone,
    calendar,
  }
}

export function movePlainYearMonth(plainYearMonth, durationFields, options) {
  const { calendar } = getInternals(plainYearMonth)
  let plainDate = plainYearMonthToPlainDate(plainYearMonth, {
    day: durationFields.sign < 0
      ? calendar.daysInMonth(plainYearMonth)
      : 1,
  })
  plainDate = moveDate(calendar, plainDate, durationFields, options)
  return dateToPlainYearMonth(plainDate)
}

export function movePlainDateTime(plainDateTime, durationFields, options) {
  const internals = getInternals(plainDateTime)
  const [movedIsoTimeFields, dayDelta] = addIsoTimeFields(
    internals,
    durationTimeFieldsToIso(durationFields),
  )

  const movedPlainDate = moveDate(
    internals.calendar,
    internals, // only date parts will be used
    {
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (must be zero so calendar doesn't round)
      days: durationFields.days + dayDelta,
    },
    options,
  )

  return createPlainDateTime({
    ...getInternals(movedPlainDate),
    ...movedIsoTimeFields,
  })
}

// Used internally by Calendar::dateAdd (aka movePlainDate)
// -------------------------------------------------------------------------------------------------

// TODO

// Epoch/Time
// -------------------------------------------------------------------------------------------------

export function moveEpochNanoseconds(epochNanoseconds, durationFields) {
  return epochNanoseconds.add(onlyDurationTimeFieldsToIso(durationFields))
}

/*
Accepts internals but returns PlainTime
*/
export function movePlainTime(internals, durationFields) {
  const [movedIsoTimeFields] = addIsoTimeFields(
    internals,
    onlyDurationTimeFieldsToIso(durationFields),
  )
  return createPlainTime(movedIsoTimeFields)
}

function onlyDurationTimeFieldsToIso(durationFields) {
  if (durationHasDateParts(durationFields)) {
    throw new RangeError('Cant have date parts')
  }
  return durationTimeFieldsToIso(durationFields)
}

function addIsoTimeFields(isoTimeFields0, isoTimeFields1) {
  return nanosecondsToIsoTimeFields( // returns [movedIsoTimeFields, dayDelta]
    isoTimeFieldsToNanoseconds(isoTimeFields0) +
    isoTimeFieldsToNanoseconds(isoTimeFields1),
  )
}
