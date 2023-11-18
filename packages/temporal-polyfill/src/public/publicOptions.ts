import { parseZonedOrPlainDateTime } from '../internal/isoParse'
import { ensureString } from '../internal/cast'
import { isObjectlike } from '../internal/utils'

// public
import { refineMaybeZonedDateTimeBag } from './convert'
import { IsoDateSlots, PlainDateSlots, ZonedDateTimeSlots, ZonedEpochSlots, getSlots, pluckIsoDateInternals } from './slots'
import type { PlainDate } from './plainDate'
import type { ZonedDateTime, ZonedDateTimeBag } from './zonedDateTime'

export function refinePublicRelativeTo(relativeTo: ZonedDateTime | PlainDate | string): ZonedEpochSlots | IsoDateSlots | undefined {
  if (relativeTo !== undefined) {
    if (isObjectlike(relativeTo)) {
      const slots = getSlots(relativeTo)
      const { branding } = slots || {}

      if (branding === 'ZonedDateTime' ||
        branding === 'PlainDate') {
        return slots as (ZonedDateTimeSlots | PlainDateSlots)
      } else if (branding === 'PlainDateTime') {
        return pluckIsoDateInternals(slots as any)
      }

      return refineMaybeZonedDateTimeBag(relativeTo as unknown as ZonedDateTimeBag)
    }

    return parseZonedOrPlainDateTime(ensureString(relativeTo))
  }
}
