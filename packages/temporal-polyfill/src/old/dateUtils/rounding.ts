import { Temporal } from 'temporal-spec'
import { OFFSET_PREFER } from '../argParse/offsetHandling'
import { RoundingConfig } from '../argParse/roundingOptions'
import { LargeInt } from '../utils/largeInt'
import { roundToIncrement, roundToIncrementBI } from '../utils/math'
import { isoTimeToNano, nanoToISOTime, zeroISOTimeFields } from './dayAndTime'
import { splitEpochNano } from './epoch'
import { ISODateTimeFields, ISOTimeFields } from './isoFields'
import { computeNanoInDay, computeZonedDateTimeEpochNano } from './offset'
import { addDays } from './translate'
import { DAY, DayTimeUnitInt, TimeUnitInt } from './units'

export function roundDateTime(
  fields: ISODateTimeFields,
  roundingConfig: RoundingConfig<DayTimeUnitInt>,
): ISODateTimeFields {
  const timeNano = isoTimeToNano(fields)
  const roundedTimeNano = roundNano(timeNano, roundingConfig)
  const [isoTimeFields, dayDelta] = nanoToISOTime(roundedTimeNano)

  const dayStartTranslated = addDays(fields, dayDelta)
  return { ...dayStartTranslated, ...isoTimeFields }
}

export function roundTime(
  fields: ISOTimeFields,
  roundingConfig: RoundingConfig<TimeUnitInt>,
): ISOTimeFields {
  const timeNano = isoTimeToNano(fields)
  const roundedTimeNano = roundNano(timeNano, roundingConfig)
  const [isoTimeFields] = nanoToISOTime(roundedTimeNano)
  return isoTimeFields
}

export function roundEpochNano(
  epochNano: LargeInt,
  roundingConfig: RoundingConfig<TimeUnitInt>,
): LargeInt {
  const [dayEpochNano, timeNano] = splitEpochNano(epochNano)
  const roundedTimeNano = roundNano(timeNano, roundingConfig)
  return dayEpochNano.add(roundedTimeNano)
}

// returns epochNano!
export function roundZonedDateTimeFields(
  fields: ISODateTimeFields & {
    calendar: Temporal.CalendarProtocol,
    timeZone: Temporal.TimeZoneProtocol,
  },
  offsetNanoseconds: number,
  roundingConfig: RoundingConfig<DayTimeUnitInt>,
): LargeInt {
  const { calendar, timeZone } = fields
  let timeNano = isoTimeToNano(fields)
  let isoTimeFields: ISOTimeFields
  let dayDelta: number

  if (roundingConfig.smallestUnit === DAY) {
    isoTimeFields = zeroISOTimeFields
    dayDelta = roundingConfig.roundingFunc(timeNano / computeNanoInDay(fields))
  } else {
    timeNano = roundNano(timeNano, roundingConfig)
    ;([isoTimeFields, dayDelta] = nanoToISOTime(timeNano))
  }

  const dayStartTranslated = addDays(fields, dayDelta)
  return computeZonedDateTimeEpochNano(
    {
      ...dayStartTranslated,
      ...isoTimeFields,
      offsetNanoseconds,
      calendar, // !!!
      timeZone, // !!!
    },
    false,
    OFFSET_PREFER, // for offsetNanoseconds conflicts
  )
}

// low-level utils (just for day-and-time)

export function roundNano(nano: number, roundingConfig: RoundingConfig<DayTimeUnitInt>): number {
  return roundToIncrement(
    nano,
    roundingConfig.incNano,
    roundingConfig.roundingFunc,
  )
}

export function roundNanoBI(
  nano: LargeInt,
  roundingConfig: RoundingConfig<DayTimeUnitInt>,
): LargeInt {
  return roundToIncrementBI(
    nano,
    roundingConfig.incNano,
    roundingConfig.roundingFunc,
  )
}
