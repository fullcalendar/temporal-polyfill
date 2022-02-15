import { IntlCalendarImpl } from './intlCalendarImpl'

const namedMonthsToCodes: { [MonthStr: string]: string } = {
  Tishri: 'M01',
  Heshvan: 'M02',
  Kislev: 'M03',
  Tevet: 'M04',
  Shevat: 'M05',
  'Adar I': 'M05L',
  'Adar II': 'M06',
  Adar: 'M06',
  Nisan: 'M07',
  Iyar: 'M08',
  Sivan: 'M09',
  Tamuz: 'M10',
  Av: 'M11',
  Elul: 'M12',
}

export class HebrewCalendarImpl extends IntlCalendarImpl {
  parseMonth(monthStr: string, year: number): number {
    const monthNum = parseInt(monthStr)
    if (isNaN(monthNum)) { // sometimes a number, sometimes not
      return this.convertMonthCode(namedMonthsToCodes[monthStr], year)
    }
    return monthNum
  }

  // month -> monthCode
  monthCode(month: number, year: number): string {
    const downShift = this.inLeapYear(year) && month > 5
    return super.monthCode(month - Number(downShift), year) +
      (downShift && month === 6 ? 'L' : '')
  }

  // monthCode -> month
  convertMonthCode(monthCode: string, year: number): number {
    // simply parses the # in the string, ignoring 'L'
    const month = super.convertMonthCode(monthCode, year)
    return month +
      (monthCode.match(/L$/) || (this.inLeapYear(year) && month > 5)
        ? 1
        : 0)
  }

  // leap years have 13 months instead of 12.
  // couldn't rely on # of days. varies greatly.
  inLeapYear(year: number): boolean {
    const months = this.monthsInYear(year)
    return months > this.monthsInYear(year - 1) &&
      months > this.monthsInYear(year + 1)
  }
}
