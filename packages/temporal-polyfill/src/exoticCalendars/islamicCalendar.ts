import { modFloor } from '../internal/utils'
import { createArithmeticCalendar } from './utils/arithmeticCalendar'

// Adapted from Adobe's @internationalized/date Islamic calendar implementation
// and ICU-style arithmetic calendar rules.

const civilIslamicEpoch = 1948440
const astronomicalIslamicEpoch = 1948439
const umalquraYearStart = 1300
const umalquraYearEnd = 1600
const umalquraStartDays = 460322

const umalquraMonthLengths = [
  2730, 3412, 3785, 1748, 1770, 876, 2733, 1365, 1705, 1938, 2985, 1492, 2778,
  1372, 3373, 1685, 1866, 2900, 2922, 1453, 1198, 2639, 1303, 1675, 1701, 2773,
  726, 2395, 1181, 2637, 3366, 3477, 1452, 2486, 698, 2651, 1323, 2709, 1738,
  2793, 756, 2422, 694, 2390, 2762, 2980, 3026, 1497, 732, 2413, 1357, 2725,
  2898, 2981, 1460, 2486, 1367, 663, 1355, 1699, 1874, 2917, 1386, 2731, 1323,
  3221, 3402, 3493, 1482, 2774, 2391, 1195, 2379, 2725, 2898, 2922, 1397, 630,
  2231, 1115, 1365, 1449, 1460, 2522, 1245, 622, 2358, 2730, 3412, 3506, 1493,
  730, 2395, 1195, 2645, 2889, 2916, 2929, 1460, 2741, 2645, 3365, 3730, 3785,
  1748, 2793, 2411, 1195, 2707, 3401, 3492, 3506, 2745, 1210, 2651, 1323, 2709,
  2858, 2901, 1372, 1213, 573, 2333, 2709, 2890, 2906, 1389, 694, 2363, 1179,
  1621, 1705, 1876, 2922, 1388, 2733, 1365, 2857, 2962, 2985, 1492, 2778, 1370,
  2731, 1429, 1865, 1892, 2986, 1461, 694, 2646, 3661, 2853, 2898, 2922, 1453,
  686, 2351, 1175, 1611, 1701, 1708, 2774, 1373, 1181, 2637, 3350, 3477, 1450,
  1461, 730, 2395, 1197, 1429, 1738, 1764, 2794, 1269, 694, 2390, 2730, 2900,
  3026, 1497, 746, 2413, 1197, 2709, 2890, 2981, 1458, 2485, 1238, 2711, 1351,
  1683, 1865, 2901, 1386, 2667, 1323, 2699, 3398, 3491, 1482, 2774, 1243, 619,
  2379, 2725, 2898, 2921, 1397, 374, 2231, 603, 1323, 1381, 1460, 2522, 1261,
  365, 2230, 2726, 3410, 3497, 1492, 2778, 2395, 1195, 1619, 1833, 1890, 2985,
  1458, 2741, 1365, 2853, 3474, 3785, 1746, 2793, 1387, 1195, 2645, 3369, 3412,
  3498, 2485, 1210, 2619, 1179, 2637, 2730, 2773, 730, 2397, 1118, 2606, 3226,
  3413, 1714, 1721, 1210, 2653, 1325, 2709, 2898, 2984, 2996, 1465, 730, 2394,
  2890, 3492, 3793, 1768, 2922, 1389, 1333, 1685, 3402, 3496, 3540, 1754, 1371,
  669, 1579, 2837, 2890, 2965, 1450, 2734, 2350, 3215, 1319, 1685, 1706, 2774,
  1373, 669,
]

const umalquraPlainMonthDay30ReferenceYears = [
  1392, 1390, 1391, 1392, 1391, 1392, 1389, 1392, 1392, 1390, 1391, 1390,
]

const enum IslamicCalendarVariant {
  // Keep Umm al-Qura at 0 so repeated branch checks can minify to `!id`.
  Umalqura = 0,
  Civil = 1,
  Tabular = 2,
}

// parallels IslamicCalendarVariant
const islamicCalendarVariantIds = [
  'islamic-umalqura',
  'islamic-civil',
  'islamic-tbla',
] as const

const umalquraYearStarts = (() => {
  const starts = [0]
  let yearStart = 0
  for (let year = umalquraYearStart; year <= umalquraYearEnd; year++) {
    for (let month = 1; month <= 12; month++) {
      yearStart += umalquraMonthLength(year, month)
    }
    starts.push(yearStart)
  }
  return starts
})()

export function createIslamicCivilCalendar() {
  return createIslamicCalendar(IslamicCalendarVariant.Civil)
}

export function createIslamicTabularCalendar() {
  return createIslamicCalendar(IslamicCalendarVariant.Tabular)
}

export function createIslamicUmmAlQuraCalendar() {
  return createIslamicCalendar(IslamicCalendarVariant.Umalqura)
}

function createIslamicCalendar(variant: IslamicCalendarVariant) {
  const epoch =
    variant === IslamicCalendarVariant.Tabular
      ? astronomicalIslamicEpoch
      : civilIslamicEpoch

  return createArithmeticCalendar({
    id: islamicCalendarVariantIds[variant],
    eraOrigins: {
      'bh': -1,
      'ah': 0,
    },
    fromJulianDay(julianDay) {
      // `!variant` is Umm al-Qura; see IslamicCalendarVariant.
      return !variant
        ? julianDayToUmalqura(julianDay)
        : julianDayToIslamic(epoch, julianDay)
    },
    toJulianDay(year, month, day) {
      // `!variant` is Umm al-Qura; see IslamicCalendarVariant.
      return !variant
        ? umalquraToJulianDay(year, month, day)
        : islamicToJulianDay(epoch, year, month, day)
    },
    computeDaysInMonth(year, month) {
      // `!variant` is Umm al-Qura; see IslamicCalendarVariant.
      return !variant && isUmalquraYear(year)
        ? umalquraMonthLength(year, month)
        : islamicDaysInMonth(year, month)
    },
    computeDaysInYear(year) {
      // `!variant` is Umm al-Qura; see IslamicCalendarVariant.
      return !variant && isUmalquraYear(year)
        ? umalquraYearLength(year)
        : islamicIsLeapYear(year)
          ? 355
          : 354
    },
    computeMonthsInYear() {
      return 12
    },
    computeInLeapYear(year) {
      return this.computeDaysInYear(year) > 354
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth, day) {
      // Umm al-Qura is observational. test262 pins each 30-day PlainMonthDay
      // reference to a year where that month actually had 30 days.
      const umalquraReferenceYear =
        // `!variant` is Umm al-Qura; see IslamicCalendarVariant.
        !variant &&
        !isLeapMonth &&
        day === 30 &&
        umalquraPlainMonthDay30ReferenceYears[monthCodeNumber - 1]

      // `!variant` is Umm al-Qura; see IslamicCalendarVariant.
      return !variant && umalquraReferenceYear
        ? { year: umalquraReferenceYear, month: monthCodeNumber }
        : undefined
    },
    computeEraFields({ year }) {
      return year < 1
        ? { era: 'bh', eraYear: 1 - year }
        : { era: 'ah', eraYear: year }
    },
  })
}

function islamicToJulianDay(
  epoch: number,
  year: number,
  month: number,
  day: number,
): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    epoch -
    1
  )
}

function julianDayToIslamic(epoch: number, julianDay: number) {
  const year = Math.floor((30 * (julianDay - epoch) + 10646) / 10631)
  const month = Math.min(
    12,
    Math.ceil(
      (julianDay - (29 + islamicToJulianDay(epoch, year, 1, 1))) / 29.5,
    ) + 1,
  )
  const day = julianDay - islamicToJulianDay(epoch, year, month, 1) + 1
  return { year, month, day }
}

function islamicIsLeapYear(year: number): boolean {
  return modFloor(14 + 11 * year, 30) < 11
}

function islamicDaysInMonth(year: number, month: number) {
  return 29 + (month % 2) + (month === 12 && islamicIsLeapYear(year) ? 1 : 0)
}

function isUmalquraYear(year: number) {
  return year >= umalquraYearStart && year <= umalquraYearEnd
}

function umalquraYearStartDay(year: number): number {
  return umalquraStartDays + umalquraYearStarts[year - umalquraYearStart]
}

function umalquraMonthLength(year: number, month: number): number {
  const idx = year - umalquraYearStart
  const mask = 0x01 << (11 - (month - 1))
  return (umalquraMonthLengths[idx] & mask) === 0 ? 29 : 30
}

function umalquraMonthStart(year: number, month: number): number {
  let day = umalquraYearStartDay(year)
  for (let i = 1; i < month; i++) {
    day += umalquraMonthLength(year, i)
  }
  return day
}

function umalquraYearLength(year: number): number {
  return (
    umalquraYearStarts[year + 1 - umalquraYearStart] -
    umalquraYearStarts[year - umalquraYearStart]
  )
}

function julianDayToUmalqura(julianDay: number) {
  const days = julianDay - civilIslamicEpoch
  if (
    days < umalquraYearStartDay(umalquraYearStart) ||
    days >= umalquraYearStartDay(umalquraYearEnd + 1)
  ) {
    return julianDayToIslamic(civilIslamicEpoch, julianDay)
  }

  let year = umalquraYearStart
  while (days >= umalquraYearStartDay(year + 1)) {
    year++
  }

  let month = 1
  while (
    days >=
    umalquraMonthStart(year, month) + umalquraMonthLength(year, month)
  ) {
    month++
  }

  return { year, month, day: days - umalquraMonthStart(year, month) + 1 }
}

function umalquraToJulianDay(year: number, month: number, day: number): number {
  return isUmalquraYear(year)
    ? civilIslamicEpoch + umalquraMonthStart(year, month) + day - 1
    : islamicToJulianDay(civilIslamicEpoch, year, month, day)
}
