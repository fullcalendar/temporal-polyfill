import { ISOCalendarImpl } from './isoCalendarImpl'

// for converting year -> [era,eraYear]
// (can't use eraOrigins, it's for the other direction)
export class GregoryCalendarImpl extends ISOCalendarImpl {
  era(isoYear: number, _isoMonth: number, _isoDay: number): string {
    return isoYear < 1 ? 'bce' : 'ce'
  }

  eraYear(isoYear: number, _isoMonth: number, _isoDay: number): number {
    return isoYear < 1 ? -(isoYear - 1) : isoYear
  }
}
