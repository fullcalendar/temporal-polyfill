import { hashIntlFormatParts, normalizeShortEra } from '../dateUtils/intlFormat'
import { isoToEpochMilli } from '../dateUtils/isoMath'
import { GregoryCalendarImpl } from './gregoryCalendarImpl'
import { buildFormat } from './intlCalendarImpl'

const primaryEraMilli = isoToEpochMilli(1868, 9, 8)

/*
The Japanese calendar has same months like Gregorian, same eraYears,
but has era names that are Japanese after a certain point.
FYI, IntlCalendarImpl would have trouble parsing era/eraYears before this point.
*/
export class JapaneseCalendarImpl extends GregoryCalendarImpl {
  private format = buildFormat('japanese')

  era(isoYear: number, isoMonth: number, isoDay: number): string {
    const epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
    return epochMilli < primaryEraMilli
      ? super.era(isoYear, isoMonth, isoDay)
      : normalizeShortEra(hashIntlFormatParts(this.format, epochMilli).era)
  }
}
