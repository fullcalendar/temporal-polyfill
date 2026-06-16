import * as CalendarFns from 'temporal-polyfill/fns/Calendar'

export type CalendarPlugin = {
  choices: ({ label: string, id: string })[]
  getCalendarRecord(id: string): CalendarFns.Record
}

export const basicCalendars: CalendarPlugin = {
  choices: [
    { label: 'ISO', id: 'iso8601' },
    { label: 'Gregorian', id: 'gregory' },
  ],
  getCalendarRecord(id: string) {
    return CalendarFns.getBasic(id)
  }
}

export const gregoryAlignedCalendars: CalendarPlugin = {
  choices: [
    { label: 'ISO', id: 'iso8601' },
    { label: 'Gregorian', id: 'gregory' },
    { label: 'Buddhist', id: 'buddhist' },
    { label: 'Japanese', id: 'japanese' },
    { label: 'Republic of China', id: 'roc' },
  ],
  getCalendarRecord(id: string) {
    switch (id) {
      case 'iso8601': return CalendarFns.getISO()
      case 'gregory': return CalendarFns.getGregory()
      case 'buddhist': return CalendarFns.getBuddhist()
      case 'japanese': return CalendarFns.getJapanese()
      case 'roc': return CalendarFns.getRoc()
    }
    throw new RangeError(`Unsupported calendar ${id}`)
  }
}

export const allCalendars: CalendarPlugin = {
  choices: [
    { label: 'ISO', id: 'iso8601' },
    { label: 'Gregorian', id: 'gregory' },
    { label: 'Buddhist', id: 'buddhist' },
    { label: 'Chinese', id: 'chinese' },
    { label: 'Coptic', id: 'coptic' },
    { label: 'Dangi', id: 'dangi' },
    { label: 'Ethiopic', id: 'ethiopic' },
    { label: 'Ethiopic Amete Alem', id: 'ethioaa' },
    { label: 'Hebrew', id: 'hebrew' },
    { label: 'Indian', id: 'indian' },
    { label: 'Islamic Civil', id: 'islamic-civil' },
    { label: 'Islamic Tabular', id: 'islamic-tbla' },
    { label: 'Islamic Umm al-Qura', id: 'islamic-umalqura' },
    { label: 'Japanese', id: 'japanese' },
    { label: 'Persian', id: 'persian' },
    { label: 'Republic of China', id: 'roc' },
  ],
  getCalendarRecord(id: string) {
    return CalendarFns.getAny(id)
  }
}
