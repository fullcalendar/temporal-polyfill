import { createGregoryAlignedCalendar } from './utils/gregoryAlignedCalendar'

const buddhistEraOrigins = {
  'be': 0,
}

export function createBuddhistCalendar() {
  return createGregoryAlignedCalendar({
    isoYearOffset: 543,
    eraOrigins: buddhistEraOrigins,
    computeEraFields(_isoDate, calendarYear) {
      return { era: 'be', eraYear: calendarYear }
    },
  })
}
