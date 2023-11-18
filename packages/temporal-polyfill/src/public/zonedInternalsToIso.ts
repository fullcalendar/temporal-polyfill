import { epochNanoToIso } from '../internal/isoMath'
import { createLazyGenerator } from '../internal/utils'
import { timeZoneImplGetOffsetNanosecondsFor } from '../internal/timeZoneRecordSimple'

// public
import { ZonedEpochSlots } from './slots'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor } from './timeZoneRecordComplex'

export const zonedInternalsToIso = createLazyGenerator((internals: ZonedEpochSlots) => {
  const { calendar, timeZone, epochNanoseconds } = internals
  const { getOffsetNanosecondsFor } = createTimeZoneSlotRecord(timeZone, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
  }, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
  })

  const offsetNanoseconds = getOffsetNanosecondsFor(epochNanoseconds)
  const isoDateTimeFields = epochNanoToIso(epochNanoseconds, offsetNanoseconds)

  return {
    ...isoDateTimeFields,
    offsetNanoseconds,
    calendar,
  }
})
