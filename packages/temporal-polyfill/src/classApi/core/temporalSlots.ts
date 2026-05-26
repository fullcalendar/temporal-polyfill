import * as errorMessages from '../../internal/errorMessages'
import { isObjectLike } from '../../internal/utils'
import type { TemporalBrandingAndSlots } from '../intlDateTimeFormat'
import { getDurationSlotsIfPresent } from './duration'
import { getInstantSlotsIfPresent } from './instant'
import { getPlainDateSlotsIfPresent } from './plainDate'
import { getPlainDateTimeSlotsIfPresent } from './plainDateTime'
import { getPlainMonthDaySlotsIfPresent } from './plainMonthDay'
import { getPlainTimeSlotsIfPresent } from './plainTime'
import { getPlainYearMonthSlotsIfPresent } from './plainYearMonth'
import { getZonedDateTimeSlotsIfPresent } from './zonedDateTime'

/*
Detects the concrete Temporal classes in this branch by probing their local
WeakMaps directly. This keeps slot reads explicit without a shared
registration table.
*/
export function getTemporalBrandingAndSlots(
  obj: unknown,
): TemporalBrandingAndSlots | undefined {
  if (!isObjectLike(obj)) {
    return undefined
  }

  let slots: object | undefined = getInstantSlotsIfPresent(obj)
  if (slots) return ['Instant', slots]

  slots = getZonedDateTimeSlotsIfPresent(obj)
  if (slots) return ['ZonedDateTime', slots]

  slots = getPlainDateTimeSlotsIfPresent(obj)
  if (slots) return ['PlainDateTime', slots]

  slots = getPlainDateSlotsIfPresent(obj)
  if (slots) return ['PlainDate', slots]

  slots = getPlainTimeSlotsIfPresent(obj)
  if (slots) return ['PlainTime', slots]

  slots = getPlainYearMonthSlotsIfPresent(obj)
  if (slots) return ['PlainYearMonth', slots]

  slots = getPlainMonthDaySlotsIfPresent(obj)
  if (slots) return ['PlainMonthDay', slots]

  slots = getDurationSlotsIfPresent(obj)
  if (slots) return ['Duration', slots]
}

export function rejectInvalidBag<B>(bag: B): B {
  if (
    getTemporalBrandingAndSlots(bag) ||
    // RejectObjectWithCalendarOrTimeZone is a public property-bag guard.
    // It deliberately observes the spec field names even though internal
    // slots store internal calendar/time-zone objects, but public bags still
    // use the spec property names.
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throw new TypeError(errorMessages.invalidBag)
  }
  return bag
}
