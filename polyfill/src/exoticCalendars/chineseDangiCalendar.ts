import { ExoticCalendarWithoutId } from '../internal/calendarImpl'
import { monthCodeNumberToMonth } from '../internal/calendarMonthCode'
import { epochDaysToIsoDate, isoPartsToEpochDays } from '../internal/epochMath'
import { milliInHour, milliInUtcDay } from '../internal/units'
import { memoize } from '../internal/utils'
import { createArithmeticCalendar } from './utils/arithmeticCalendar'
import { unixEpochJulianDay } from './utils/gregoryJulianDay'

// Computes the Chinese and Dangi (Korean) calendars the same way as ICU4X,
// which native Temporal uses in V8, instead of reading them from the host's
// Intl.DateTimeFormat. The ICU4C data behind Intl disagrees with ICU4X on some
// years, such as Chinese New Year 2027.
// https://github.com/unicode-org/icu4x/tree/main/components/calendar/src/cal/east_asian_traditional
//
// Years 1912-2102 come from ICU4X's tables, which match the Purple Mountain
// Observatory and the Hong Kong Observatory (Chinese) and the Korea Astronomy
// and Space Science Institute (Dangi). Both calendars use ICU4X's Qing-era
// table for 1900-1911. All other years use ICU4X's mean-motion rule.
//
// Each year is 5 base-36 digits packing three numbers:
// - bits 0-12: month lengths, where a set bit means that month has 30 days
// - bits 13-16: the ordinal of the leap month, or 0 if there is none
// - bits 17-22: the days from January 19 to New Year's Day
const modernYearDataStart = 1912
const chinaYearData =
  '2cc9x1emh70ktyj212251663v0btrd1sotl1236a2hz821k9b90qhcd26pue1brue0f1kl' +
  '1y9qs13esp0bxjm1pvv60w7c629hyj1emhj0ktkm213ru18zis0etvt1snk90z8nn2f5ar' +
  '1k7qj0nrdn23wrx1bsdm0hvth1yap013e4p093mb1pv2t0tm3x29hyu1emjx0nnai212nm' +
  '167qd0ewqy1vhvu0zclx2cc5z1k7rq0qkl123wt11bsnm0htb91ybad13d5606e1j1n1y3' +
  '0wfa229i0a1emp50nnma23wwi1678l0c8jv1so5n0zeln2calp1henh0qkq126qi11btzm' +
  '0hw6d1yazp15eml2hydy1n0dy0tcqd29iad1enc90np1u23xjm190rq0bzva1pv130zemu' +
  '2f3ve1hexh0qgnd26p8p1bslv0f1gr1vga310kt7092l61n0x60tnbp2ccdg1hft50kv4j' +
  '213md166250c6991pv3p0zl4a2f4cy1k9et0qo9626qfe1btsl0hulq1vgba10kvp092nm' +
  '1puc20tehx29icl1elor0ksd31yawb1663e0bzyu1sodl0zy362f5g21k8x10qnnv23wp7' +
  '18z3f0f4nv1vgdp10l0q093rm1pvo20wgth29jj91emhh0ktyl212gm13d110c0iy1sp1l' +
  '129oy2f6361k9ba0qkie23wpj18z860eymt1vgph13dc906efn1n15f0tm3v29hyj1btcr' +
  '0ku3e212lm167ad0c8qy1socq0zfrp2f5at1help0nrfx23ws51bsfe0ezl11vhyd13eiy' +
  '09ac51n2c60tmxa29hzq1emk50ku5u212vm167xh0f03u1pua30wjvb2cazv1hemz0nrh2' +
  '23wx61bsr60huzp1vhhh10kuj069az1n0rv0tjrv29i25'
const koreaYearData =
  '2cc9x1emh70ktjv213n118z8q0btrd1sofd122qa2hz0y1k9b90qhcd26pna1brud0f1kd' +
  '1y9qs13ell0bxci1pvv60w7c629hyf1emhj0ktkm213oa18zis0etux1snk90z8nn2f5ar' +
  '1k7qj0nrdn23wj11btka0koyc1yap013e4p093mb1pv2t0tm3v29hyl1emjx0nn8q2148i' +
  '190v80ewqx1vhvu0zfrp2f5au1k7rq0qkl123wt11bsnm0htb91ybad13eq20976e1n1y3' +
  '0wf9y29i0a1emop0nnma23w42166g50c8jv1so5n0ze7f2calp1henf0qkq126qi11btzm' +
  '0hvs51yazp15eml2hydy1n0dy0tfvx2cbf81en550nouq23xjm190rq0bzva1pv130ze7q' +
  '2f5ga1k82c0qf2h26p8p1bslv0f1gn1vga310kt7092l61n0iy0tnbp2ccdg1hft50kv4j' +
  '213md166250bzvh1pv3h0zl4a2f4cy1k9et0qhxm26qfe1bted0hulp1vgba10kvp092ne' +
  '1puc20tehx29jtx1hgei0nlhy1yavv1663e0bzyt1sodl0zy362f4nm1k8x10qmvf23wp7' +
  '18z3f0f4nv1vgbx10l0p093rm1pvo20wgth29jj91emh90ktyl2122e13d110c0ix1sp0p' +
  '129hu2f6361k9ba0qkie23wpj18z4m0eylx1vglx13etl097ki1n15f0tm3v29hyj1btcr' +
  '0ku3e212lm1679x0c8qx1socp0zfrn2f5at1help0nrfx23ws51bsfe0ezl11vhyd13eiy' +
  '099xx1n2c50tm3y29hzq1emk50ku5u212vm167xh0f39m1snd60wjvb2cckr1k7ru0nrh1' +
  '23wx51bsr60huw51vhgl10k0b06fmf1n0rv0tizf29i25'
const qingYearDataStart = 1900
const qingYearData =
  '0zf0y2f4nm1k9lx0t9oq26p1n1909n0humu1y9gq13e55092z61pufm0wa3p'

// The mean-motion rule counts in milliseconds since the Unix epoch.
// The mean Gregorian year, and a twelfth of it for each major solar term
const meanYearMilli = (146097 * milliInUtcDay) / 400
const meanSolarTermMilli = meanYearMilli / 12
// 29.5305888531 days, cut to whole milliseconds as ICU4X does
const meanSynodicMonthMilli = 2551442876
// The winter solstice at 1999-12-22T07:44Z
const solsticeEpochMilli = 945848640000
// The new moon at 2000-01-06T18:14Z
const newMoonEpochMilli = 947182440000
// Beijing time before 1912 was UTC+1397/180 hours
const beijingUtcOffsetMilli = (1397 * milliInHour) / 180

// Month-day slots store a canonical reference date, not the user-supplied year.
// For Chinese/Dangi leap months, Temporal uses a modern reference table rather
// than blindly accepting every historical result. A value of 0 means that
// monthCode has no accepted month-day leap-month reference row; 29 means that
// days 1-29 are accepted as leap month-days, but day 30 constrains to the
// corresponding common month. Month codes omitted from this table are accepted
// according to normal calendar lookup.
const monthDayLeapMonthMaxDays: Record<number, number> = {
  1: 0,
  2: 29,
  8: 29,
  9: 29,
  10: 29,
  11: 29,
  12: 0,
}

// A month-day's reference year is the latest year from 1972 back to 1900 in
// which the date falls on or before 1972-12-31. If there is none, it is the
// earliest year up to 2035 in which the date falls after 1972-12-31.
// https://tc39.es/proposal-intl-era-monthcode/#sec-temporal-calendarmonthdaytoisoreferencedate
const monthDayReferenceEndEpochDays = isoPartsToEpochDays(1972, 12, 31)
const monthDayReferenceYearRanges = [
  [1972, 1900],
  [1972, 2035],
]

interface ChineseYearData {
  newYearEpochDays: number
  monthLengths: number
  leapMonth: number
}

export function createChineseDangiCalendar(
  canonicalId: string,
): ExoticCalendarWithoutId {
  const isChinese = canonicalId === 'chinese'
  const modernYearData = isChinese ? chinaYearData : koreaYearData
  const modernUtcOffsetMilli = (isChinese ? 8 : 9) * milliInHour

  const queryYearData = memoize(
    (year: number): ChineseYearData =>
      unpackYearData(modernYearData, modernYearDataStart, year) ||
      (year < modernYearDataStart
        ? unpackYearData(qingYearData, qingYearDataStart, year) ||
          computeMeanYearData(beijingUtcOffsetMilli, year)
        : computeMeanYearData(modernUtcOffsetMilli, year)),
  )

  return createArithmeticCalendar({
    leapMonthMeta: 13,
    monthDayLeapMonthMaxDays,
    // When a Chinese/Dangi month-day leap month-day falls outside the
    // accepted leap reference table, Temporal constrains through the
    // corresponding common month. Common lunisolar months top out at 30 days.
    monthDayCommonMonthMaxDay: 30,
    fromJulianDay(julianDay) {
      const epochDays = julianDay - unixEpochJulianDay
      // New Year falls in January or February, so the date is in the year
      // numbered like its ISO year or in the year before it
      let year = epochDaysToIsoDate(epochDays).year
      if (epochDays < queryYearData(year).newYearEpochDays) {
        year--
      }

      const { newYearEpochDays, monthLengths } = queryYearData(year)
      let day = epochDays - newYearEpochDays + 1
      let month = 1
      let daysInMonth: number
      while (day > (daysInMonth = computeDaysInMonth(monthLengths, month))) {
        day -= daysInMonth
        month++
      }
      return { year, month, day }
    },
    toJulianDay(year, month, day) {
      const { newYearEpochDays, monthLengths } = queryYearData(year)
      return (
        unixEpochJulianDay +
        newYearEpochDays +
        countDaysBeforeMonth(monthLengths, month) +
        day -
        1
      )
    },
    computeDaysInMonth(year, month) {
      return computeDaysInMonth(queryYearData(year).monthLengths, month)
    },
    computeDaysInYear(year) {
      const { monthLengths, leapMonth } = queryYearData(year)
      return countDaysBeforeMonth(monthLengths, leapMonth ? 14 : 13)
    },
    computeMonthsInYear(year) {
      return queryYearData(year).leapMonth ? 13 : 12
    },
    computeInLeapYear(year) {
      return Boolean(queryYearData(year).leapMonth)
    },
    computeLeapMonth(year) {
      return queryYearData(year).leapMonth || undefined
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth, day) {
      for (const [startYear, endYear] of monthDayReferenceYearRanges) {
        const step = endYear > startYear ? 1 : -1
        const searchesBack = step < 0
        for (let year = startYear; year !== endYear + step; year += step) {
          const { newYearEpochDays, monthLengths, leapMonth } =
            queryYearData(year)
          const month = monthCodeNumberToMonth(
            monthCodeNumber,
            isLeapMonth,
            leapMonth,
          )
          const epochDays =
            newYearEpochDays +
            countDaysBeforeMonth(monthLengths, month) +
            day -
            1
          const isOnOrBeforeEnd = epochDays <= monthDayReferenceEndEpochDays

          // Month codes past M12 have no month, so they never match
          if (
            month <= (leapMonth ? 13 : 12) &&
            isLeapMonth === (month === leapMonth) &&
            day <= computeDaysInMonth(monthLengths, month) &&
            isOnOrBeforeEnd === searchesBack
          ) {
            return { year, month }
          }
        }
      }
    },
  })
}

function unpackYearData(
  yearData: string,
  startYear: number,
  year: number,
): ChineseYearData | undefined {
  const index = (year - startYear) * 5
  if (index >= 0 && index < yearData.length) {
    const packed = parseInt(yearData.slice(index, index + 5), 36)
    return {
      newYearEpochDays: isoPartsToEpochDays(year, 1, 19) + (packed >> 17),
      monthLengths: packed & 0x1fff,
      leapMonth: (packed >> 13) & 0xf,
    }
  }
}

function computeDaysInMonth(monthLengths: number, month: number): number {
  return 29 + ((monthLengths >> (month - 1)) & 1)
}

function countDaysBeforeMonth(monthLengths: number, month: number): number {
  let days = 0
  for (let monthBefore = 1; monthBefore < month; monthBefore++) {
    days += computeDaysInMonth(monthLengths, monthBefore)
  }
  return days
}

/*
ICU4X's simple rule, after the píngqì rule of the Ming dynasty. Solar terms
follow the mean Gregorian year and new moons the mean synodic month, each
counted in local time from a moment near 2000.
https://github.com/unicode-org/icu4x/blob/main/components/calendar/src/cal/east_asian_traditional/simple.rs
*/
function computeMeanYearData(
  utcOffsetMilli: number,
  year: number,
): ChineseYearData {
  // The winter solstice falls in month 11 of the year before
  let solarTermMilli = findPeriodOnOrBefore(
    isoPartsToEpochDays(year) - 1,
    solsticeEpochMilli + utcOffsetMilli,
    meanYearMilli,
  )
  let newMoonMilli = findPeriodOnOrBefore(
    milliToEpochDays(solarTermMilli),
    newMoonEpochMilli + utcOffsetMilli,
    meanSynodicMonthMilli,
  )
  let nextNewMoonMilli = newMoonMilli + meanSynodicMonthMilli
  let solarTerm = -2
  // Between two winter solstices, only the first month with no major solar
  // term is a leap month
  let hadLeapMonth = false

  function isLeapMonth() {
    return (
      !hadLeapMonth &&
      milliToEpochDays(nextNewMoonMilli) <= milliToEpochDays(solarTermMilli)
    )
  }

  function moveToNextMonth() {
    if (isLeapMonth()) {
      hadLeapMonth = true
    } else {
      solarTerm++
      solarTermMilli += meanSolarTermMilli
    }
    newMoonMilli = nextNewMoonMilli
    nextNewMoonMilli += meanSynodicMonthMilli
  }

  // Skip month 11, month 12 and a leap month after either
  while (solarTerm < 0 || isLeapMonth()) {
    moveToNextMonth()
  }

  const newYearEpochDays = milliToEpochDays(newMoonMilli)
  let monthLengths = 0
  let leapMonth = 0

  while (solarTerm < 12 || isLeapMonth()) {
    if (
      milliToEpochDays(nextNewMoonMilli) - milliToEpochDays(newMoonMilli) ===
      30
    ) {
      monthLengths |= 1 << (solarTerm + (leapMonth ? 1 : 0))
    }
    if (isLeapMonth()) {
      leapMonth = solarTerm + 1
    }
    moveToNextMonth()
  }

  return { newYearEpochDays, monthLengths, leapMonth }
}

// The latest moment base + n * period that falls on or before the given day
function findPeriodOnOrBefore(
  epochDays: number,
  baseMilli: number,
  periodMilli: number,
): number {
  return (
    baseMilli +
    Math.floor(
      ((epochDays + 1) * milliInUtcDay - 1 - baseMilli) / periodMilli,
    ) *
      periodMilli
  )
}

function milliToEpochDays(milli: number): number {
  return Math.floor(milli / milliInUtcDay)
}
