import {
  DurationBranding,
  InstantBranding,
  PlainDateBranding,
  PlainDateTimeBranding,
  PlainMonthDayBranding,
  PlainTimeBranding,
  PlainYearMonthBranding,
  ZonedDateTimeBranding,
} from '../../apiHelpers/branding'
import * as errorMessages from '../../internal/errorMessages'
import { isObjectLike, throwTypeError } from '../../internal/utils'
import type { TemporalBrandingAndSlots } from '../intlDateTimeFormat'
import { getDurationSlotsIfPresent } from './duration'
import { getInstantSlotsIfPresent } from './instant'
import { getPlainDateSlotsIfPresent } from './plainDate'
import { getPlainDateTimeSlotsIfPresent } from './plainDateTime'
import { getPlainMonthDaySlotsIfPresent } from './plainMonthDay'
import { getPlainTimeSlotsIfPresent } from './plainTime'
import { getPlainYearMonthSlotsIfPresent } from './plainYearMonth'
import { getZonedDateTimeSlotsIfPresent } from './zonedDateTime'

export function getTemporalBrandingAndSlots(
  obj: unknown,
): TemporalBrandingAndSlots | undefined {
  if (!isObjectLike(obj)) {
    return undefined
  }

  let slots: object | undefined = getInstantSlotsIfPresent(obj)
  if (slots) return [InstantBranding, slots]

  slots = getZonedDateTimeSlotsIfPresent(obj)
  if (slots) return [ZonedDateTimeBranding, slots]

  slots = getPlainDateTimeSlotsIfPresent(obj)
  if (slots) return [PlainDateTimeBranding, slots]

  slots = getPlainDateSlotsIfPresent(obj)
  if (slots) return [PlainDateBranding, slots]

  slots = getPlainTimeSlotsIfPresent(obj)
  if (slots) return [PlainTimeBranding, slots]

  slots = getPlainYearMonthSlotsIfPresent(obj)
  if (slots) return [PlainYearMonthBranding, slots]

  slots = getPlainMonthDaySlotsIfPresent(obj)
  if (slots) return [PlainMonthDayBranding, slots]

  slots = getDurationSlotsIfPresent(obj)
  if (slots) return [DurationBranding, slots]
}

export function validateBag<B>(bag: B): B {
  if (
    getTemporalBrandingAndSlots(bag) ||
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throwTypeError(errorMessages.invalidBag)
  }
  return bag
}
