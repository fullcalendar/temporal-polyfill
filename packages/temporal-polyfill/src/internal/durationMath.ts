import { BigNano, addBigNanos, bigNanoToNumber } from './bigNano'
import { DiffOps } from './calendarOps'
import { diffDatesBig } from './diff'
import {
  DurationFields,
  DurationTimeFields,
  durationCalendarFieldNamesAsc,
  durationDateFieldNamesAsc,
  durationFieldDefaults,
  durationFieldNamesAsc,
} from './durationFields'
import * as errorMessages from './errorMessages'
import { IsoDateTimeFields } from './isoFields'
import {
  Marker,
  RelativeToSlots,
  createMarkerSystem,
  isUniformUnit,
  joinIsoDateAndTime,
  markerEpochNanoToIsoDateTime,
  markerIsoDateTimeToEpochNano,
  markerToIsoDateTime,
  moveMarkerIsoDateTime,
  prepareMarkerIsoDateTimeDiff,
  splitDuration,
} from './markerSystem'
import { moveDate } from './move'
import { Overflow } from './options'
import {
  DurationRoundingOptions,
  RelativeToOptions,
  normalizeOptions,
  refineDurationRoundOptions,
} from './optionsRefine'
import { roundDayTimeDuration, roundRelativeDuration } from './round'
import { DurationSlots, createDurationSlots } from './slots'
import { TimeZoneOps } from './timeZoneOps'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  givenFieldsToBigNano,
  nanoInSec,
  nanoInUtcDay,
  nanoToGivenFields,
  unitNanoMap,
} from './units'
import { NumberSign, clampEntity } from './utils'

const maxCalendarUnit = 2 ** 32 - 1 // inclusive

export function balanceDuration(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps | undefined,
  marker: Marker,
  durationSlots: DurationSlots,
  largestUnit: Unit,
  viaWeeks: boolean, // can only be true if largestUnit>Week
): [DurationFields, IsoDateTimeFields, BigNano] {
  const isoDateTime0 = markerToIsoDateTime(timeZoneOps, marker)
  const epochNano1 = moveMarkerIsoDateTime(
    calendarOps,
    timeZoneOps,
    isoDateTime0,
    durationSlots,
  )
  const isoDateTime1 = markerEpochNanoToIsoDateTime(timeZoneOps, epochNano1)
  const [isoDate0, isoDate1, timeNano] = prepareMarkerIsoDateTimeDiff(
    timeZoneOps,
    isoDateTime0,
    isoDateTime1,
    epochNano1,
    durationSlots.sign,
  )

  // TODO: make tree-shakeable b/c total() doesn't need viaWeek
  let dateDiff: any
  if (viaWeeks) {
    const isoDateMid = moveDate(calendarOps, isoDate0, {
      ...durationFieldDefaults,
      years: durationSlots.years,
      months: durationSlots.months,
    })
    const ymDiff = calendarOps.dateUntil(isoDate0, isoDateMid, largestUnit)
    const wdDiff = calendarOps.dateUntil(isoDateMid, isoDate1, Unit.Week)
    dateDiff = {
      ...wdDiff,
      years: ymDiff.years,
      months: ymDiff.months,
    }
  } else {
    dateDiff = diffDatesBig(
      calendarOps,
      isoDate0,
      isoDate1,
      Math.max(Unit.Day, largestUnit), // ensure >=Day
    )
  }

  const timeDiff = nanoToDurationTimeFields(timeNano)
  const balancedDuration = { ...dateDiff, ...timeDiff }

  return [balancedDuration, isoDateTime0, epochNano1]
}

// Adding
// -----------------------------------------------------------------------------

export function addDurations<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  doSubtract: boolean,
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RA>,
): DurationSlots {
  const normalOptions = normalizeOptions(options)
  const relativeToSlots = refineRelativeTo(normalOptions.relativeTo)
  const maxUnit = Math.max(
    getMaxDurationUnit(slots),
    getMaxDurationUnit(otherSlots),
  ) as Unit

  if (isUniformUnit(maxUnit, relativeToSlots)) {
    return createDurationSlots(
      checkDurationUnits(
        addDayTimeDurations(
          slots,
          otherSlots,
          maxUnit as DayTimeUnit,
          doSubtract,
        ),
      ),
    )
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  // At this point,
  // maxUnit >=Day

  if (doSubtract) {
    otherSlots = negateDurationFields(otherSlots) as any // !!!
  }

  const [marker, calendarOps, timeZoneOps] = createMarkerSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )

  const [durDateFields0, durTimeNano0] = splitDuration(slots)
  const [durDateFields1, durTimeNano1] = splitDuration(otherSlots)

  // Move
  const isoDateTime0 = markerToIsoDateTime(timeZoneOps, marker)
  const isoDate1 = moveDate(calendarOps, isoDateTime0, durDateFields0)
  const isoDate2 = moveDate(calendarOps, isoDate1, durDateFields1)
  const isoDateTime2 = joinIsoDateAndTime(isoDate2, isoDateTime0)
  const epochNano2 = markerIsoDateTimeToEpochNano(timeZoneOps, isoDateTime2)
  const epochNano3 = addBigNanos(
    epochNano2,
    addBigNanos(durTimeNano0, durTimeNano1),
  )
  const isoDateTime3 = markerEpochNanoToIsoDateTime(timeZoneOps, epochNano3)

  // Diff
  const [diffDate0, diffDate1, timeDiffNano] = prepareMarkerIsoDateTimeDiff(
    timeZoneOps,
    isoDateTime0,
    isoDateTime3,
    epochNano3,
    slots.sign,
  )
  return createDurationSlots({
    ...diffDatesBig(calendarOps, diffDate0, diffDate1, maxUnit),
    ...nanoToDurationTimeFields(timeDiffNano),
  })
}

function addDayTimeDurations(
  a: DurationFields,
  b: DurationFields,
  largestUnit: DayTimeUnit,
  doSubtract?: boolean,
): DurationFields {
  const bigNano0 = durationFieldsToBigNano(a)
  const bigNano1 = durationFieldsToBigNano(b)
  const combined = addBigNanos(bigNano0, bigNano1, doSubtract ? -1 : 1)

  if (!Number.isFinite(combined[0])) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(combined, largestUnit),
  }
}

// Rounding
// -----------------------------------------------------------------------------

export function roundDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: DurationRoundingOptions<RA>,
): DurationSlots {
  const durationLargestUnit = getMaxDurationUnit(slots)
  const [
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    relativeToSlots,
  ] = refineDurationRoundOptions(options, durationLargestUnit, refineRelativeTo)

  const maxUnit = Math.max(durationLargestUnit, largestUnit)

  if (isUniformUnit(maxUnit, relativeToSlots)) {
    return createDurationSlots(
      checkDurationUnits(
        roundDayTimeDuration(
          slots,
          largestUnit as DayTimeUnit,
          smallestUnit as DayTimeUnit,
          roundingInc,
          roundingMode,
        ),
      ),
    )
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const [marker, calendarOps, timeZoneOps] = createMarkerSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )

  let [balancedDuration, startIsoDateTime, endEpochNano] = balanceDuration(
    calendarOps,
    timeZoneOps,
    marker,
    slots,
    largestUnit,
    smallestUnit === Unit.Week && largestUnit > Unit.Week,
  )

  const origSign = slots.sign
  const balancedSign = computeDurationSign(balancedDuration)
  if (origSign && balancedSign && origSign !== balancedSign) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  if (balancedSign) {
    balancedDuration = roundRelativeDuration(
      balancedDuration,
      endEpochNano,
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      calendarOps,
      timeZoneOps,
      startIsoDateTime,
    )
  }

  return createDurationSlots(balancedDuration)
}

// Sign / Abs / Blank
// -----------------------------------------------------------------------------

export function absDuration(slots: DurationSlots): DurationSlots {
  if (slots.sign === -1) {
    return negateDuration(slots)
  }
  return slots
}

export function negateDuration(slots: DurationSlots): DurationSlots {
  return createDurationSlots(negateDurationFields(slots))
}

export function negateDurationFields(fields: DurationFields): DurationFields {
  const res = {} as DurationFields

  for (const fieldName of durationFieldNamesAsc) {
    res[fieldName] = fields[fieldName] * -1 || 0
  }

  return res
}

export function getDurationBlank(slots: DurationSlots): boolean {
  return !slots.sign
}

export function computeDurationSign(
  fields: DurationFields,
  fieldNames = durationFieldNamesAsc,
): NumberSign {
  let sign: NumberSign = 0

  for (const fieldName of fieldNames) {
    const fieldSign = Math.sign(fields[fieldName]) as NumberSign

    if (fieldSign) {
      if (sign && sign !== fieldSign) {
        throw new RangeError(errorMessages.forbiddenDurationSigns)
      }
      sign = fieldSign
    }
  }

  return sign
}

export function checkDurationUnits(fields: DurationFields): DurationFields {
  for (const calendarUnit of durationCalendarFieldNamesAsc) {
    clampEntity(
      calendarUnit,
      fields[calendarUnit],
      -maxCalendarUnit,
      maxCalendarUnit,
      Overflow.Reject,
    )
  }

  const bigNano = durationFieldsToBigNano(fields)
  checkDurationTimeUnit(bigNanoToNumber(bigNano, nanoInSec))

  return fields
}

export function checkDurationTimeUnit(n: number): void {
  if (!Number.isSafeInteger(n)) {
    throw new RangeError(errorMessages.outOfBoundsDuration)
  }
}

// Field <-> Nanosecond Conversion
// -----------------------------------------------------------------------------

export function durationTimeFieldsToBigNanoStrict(
  fields: DurationFields,
): BigNano {
  if (durationHasDateParts(fields)) {
    throw new RangeError(errorMessages.invalidLargeUnits)
  }

  return durationFieldsToBigNano(fields, Unit.Hour)
}

export function durationFieldsToBigNano(
  fields: DurationFields,
  largestUnit: DayTimeUnit = Unit.Day,
): BigNano {
  return givenFieldsToBigNano(fields, largestUnit, durationFieldNamesAsc)
}

export function nanoToDurationDayTimeFields(
  largeNano: BigNano,
): { days: number } & DurationTimeFields
export function nanoToDurationDayTimeFields(
  largeNano: BigNano,
  largestUnit?: DayTimeUnit,
): Partial<DurationFields>
export function nanoToDurationDayTimeFields(
  bigNano: BigNano,
  largestUnit: DayTimeUnit = Unit.Day,
): Partial<DurationFields> {
  const [days, timeNano] = bigNano
  const dayTimeFields = nanoToGivenFields(
    timeNano,
    largestUnit,
    durationFieldNamesAsc,
  )

  dayTimeFields[durationFieldNamesAsc[largestUnit]]! +=
    days * (nanoInUtcDay / unitNanoMap[largestUnit])

  if (!Number.isFinite(dayTimeFields[durationFieldNamesAsc[largestUnit]]!)) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  return dayTimeFields
}

// TODO: audit
export function nanoToDurationTimeFields(nano: number): DurationTimeFields
export function nanoToDurationTimeFields(
  nano: number,
  largestUnit: TimeUnit,
): Partial<DurationTimeFields>
export function nanoToDurationTimeFields(
  nano: number,
  largestUnit: TimeUnit = Unit.Hour,
): Partial<DurationTimeFields> {
  return nanoToGivenFields(
    nano,
    largestUnit,
    durationFieldNamesAsc as (keyof DurationTimeFields)[],
  )
}

// Utils
// -----------------------------------------------------------------------------

export function durationHasDateParts(fields: DurationFields): boolean {
  return Boolean(computeDurationSign(fields, durationDateFieldNamesAsc))
}

export function getMaxDurationUnit(fields: DurationFields): Unit {
  let unit: Unit = Unit.Year

  for (; unit > Unit.Nanosecond; unit--) {
    if (fields[durationFieldNamesAsc[unit]]) {
      break
    }
  }

  return unit
}
