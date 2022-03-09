import { CalendarImplFields } from './calendarImpl'
import { ISOCalendarImpl } from './isoCalendarImpl'

// for converting year -> [era,eraYear]
// (can't use eraOrigins, it's for the other direction)
export class GregoryCalendarImpl extends ISOCalendarImpl {
  computeFields(epochMilli: number): CalendarImplFields {
    const fields = super.computeFields(epochMilli)
    const { year } = fields
    return {
      ...fields,
      era: year < 1 ? 'bce' : 'ce',
      eraYear: year < 1 ? -(year - 1) : year,
    }
  }
}
