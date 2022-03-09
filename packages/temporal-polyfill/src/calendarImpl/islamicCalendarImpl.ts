import { IntlCalendarImpl } from './intlCalendarImpl'

export class IslamicCalendarImpl extends IntlCalendarImpl {
  protected guessISOYear(year: number): number {
    // https://en.wikipedia.org/wiki/Hijri_year#Formula
    // round UP because superclass said so
    return Math.ceil(year * 32 / 33 + 622)
  }
}
