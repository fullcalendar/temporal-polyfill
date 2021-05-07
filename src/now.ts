import { Calendar } from './calendar'

export class Now {
  static epochMilliseconds() {
    return Date.now()
  }

  static timeZone() {}

  static zonedDateTime(calendar: Calendar) {}

  static zonedDateTimeISO() {}

  static plainDateTime(calendar: Calendar) {}

  static plainDateTimeISO() {}
}
