import { isoToEpochMilli } from '../dateUtils/epoch'
import { milliInDay, nanoInMilli } from '../dateUtils/units'
import { LargeInt } from '../utils/largeInt'
import { queryCalendarImpl } from './calendarImplQuery'
import { IntlCalendarImpl } from './intlCalendarImpl'

// https://bugs.chromium.org/p/chromium/issues/detail?id=1173158
const good1582 = isoToEpochMilli(1582, 10, 15)

// https://bugs.chromium.org/p/v8/issues/detail?id=10527
const goodIslamic = isoToEpochMilli(622, 7, 18)

const goodEpochMillis: { [cal: string]: number } = {
  buddhist: good1582,
  japanese: good1582,
  roc: good1582,
  islamic: goodIslamic,
  'islamic-rgsa': goodIslamic,
  indian: 0, // https://bugs.chromium.org/p/v8/issues/detail?id=10529
}

const hasBugByID: { [cal: string]: boolean } = {}

export function checkEpochNanoBuggy(epochNano: LargeInt, calendarID: string): void {
  return checkEpochMilliBuggy(epochNano.div(nanoInMilli).toNumber(), calendarID)
}

export function checkEpochMilliBuggy(epochMilli: number, calendarID: string): void {
  if (isEpochMilliBuggy(epochMilli, calendarID)) {
    throw new RangeError('Invalid timestamp for calendar')
  }
}

function isEpochMilliBuggy(epochMilli: number, calendarID: string): boolean {
  return hasEpochMilliBug(calendarID) && epochMilli < goodEpochMillis[calendarID]
}

function hasEpochMilliBug(calendarID: string) {
  let hasBug = hasBugByID[calendarID]
  if (hasBug === undefined) {
    const goodEpochMilli = goodEpochMillis[calendarID]
    if (goodEpochMilli === undefined) {
      hasBug = false
    } else {
      let impl = queryCalendarImpl(calendarID)

      // HACK
      // Even if Japanese, must leverage Intl.DateTimeFormat, so force IntlCalendarImpl
      if (!(impl instanceof IntlCalendarImpl)) {
        impl = new IntlCalendarImpl(calendarID)
      }

      const badEpochMilli = goodEpochMilli - milliInDay
      const fields = impl.computeFields(badEpochMilli)
      hasBug = badEpochMilli !== impl.epochMilliseconds(fields.year, fields.month, fields.day)
    }
    hasBugByID[calendarID] = hasBug
  }
  return hasBug
}
