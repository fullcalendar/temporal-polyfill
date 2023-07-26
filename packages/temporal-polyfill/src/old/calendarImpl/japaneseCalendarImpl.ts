import { isoToEpochMilli } from '../dateUtils/epoch'
import { hashIntlFormatParts, normalizeShortEra } from '../dateUtils/intlFormat'
import { CalendarImplFields } from './calendarImpl'
import { GregoryCalendarImpl } from './gregoryCalendarImpl'
import { buildFormat } from './intlCalendarImpl'

const primaryEraMilli = isoToEpochMilli(1868, 9, 8)

/*
The Japanese calendar has same months like Gregorian, same eraYears,
but has era names that are Japanese after a certain point.
*/
export class JapaneseCalendarImpl extends GregoryCalendarImpl {
  private format = buildFormat('japanese')

  computeFields(epochMilli: number): CalendarImplFields {
    const fields = super.computeFields(epochMilli)

    if (epochMilli >= primaryEraMilli) {
      const partHash = hashIntlFormatParts(this.format, epochMilli)
      fields.era = normalizeShortEra(partHash.era)
      fields.eraYear = parseInt(partHash.relatedYear || partHash.year) // TODO: more DRY w/ intl
    }

    return fields
  }
}
