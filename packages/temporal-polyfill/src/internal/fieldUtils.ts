import { calendarDateFieldNamesAsc, timeFieldNamesAsc } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { pluckProps } from './utils'

// returns in unit-asc order
export function combineDateAndTime(
  isoDate: CalendarDateFields,
  time: TimeFields,
): CalendarDateTimeFields {
  return {
    ...pluckProps(timeFieldNamesAsc, time),
    ...pluckProps(calendarDateFieldNamesAsc, isoDate),
  }
}
