import { createGregoryAlignedCalendar } from './utils/gregoryAlignedCalendar'

const rocEraOrigins = {
  'broc': -1,
  'roc': 0,
}

export function createRocCalendar() {
  return createGregoryAlignedCalendar({
    isoYearOffset: -1911,
    eraOrigins: rocEraOrigins,
    computeEraFields(_isoDate, calendarYear) {
      return calendarYear < 1
        ? { era: 'broc', eraYear: 1 - calendarYear }
        : { era: 'roc', eraYear: calendarYear }
    },
  })
}
