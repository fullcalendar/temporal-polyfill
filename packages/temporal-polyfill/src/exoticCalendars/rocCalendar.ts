import { createGregoryAlignedCalendar } from './utils/gregoryAlignedCalendar'

const rocEraOrigins = {
  'broc': -1,
  'roc': 0,
}

const rocEraRemaps = {
  'beforeroc': 'broc',
  'minguo': 'roc',
}

export function createRocCalendar() {
  return createGregoryAlignedCalendar({
    isoYearOffset: -1911,
    eraOrigins: rocEraOrigins,
    eraRemaps: rocEraRemaps,
    computeEraFields(_isoDate, calendarYear) {
      return calendarYear < 1
        ? { era: 'broc', eraYear: 1 - calendarYear }
        : { era: 'roc', eraYear: calendarYear }
    },
  })
}
