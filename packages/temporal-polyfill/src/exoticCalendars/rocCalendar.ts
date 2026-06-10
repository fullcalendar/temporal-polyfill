import { createGregoryAlignedCalendar } from './utils/gregoryAlignedCalendar'

// Mirrors gregoryEraOrigins
const rocEraOrigins = {
  'broc': -1,
  'roc': 0,
}

export function createRocCalendar() {
  return createGregoryAlignedCalendar({
    isoYearOffset: -1911,
    eraOrigins: rocEraOrigins,

    // Mirrors computeGregoryEraFields
    computeEraFields(_isoDate, calendarYear) {
      if (calendarYear < 1) {
        return { era: 'broc', eraYear: 1 - calendarYear }
      }
      return { era: 'roc', eraYear: calendarYear }
    },
  })
}
