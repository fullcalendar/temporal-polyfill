import { Calendar } from './calendar'
import { TimeZoneType } from './types'

export class TimeZone {
  readonly id: TimeZoneType

  constructor(id: string) {
    this.id = id as TimeZoneType
  }

  getOffsetMillisecondsFor(epochMilliseconds: number) {}
  getOffsetStringFor(epochMilliseconds: number) {}
  getPlainDateTimeFor(epochMilliseconds: number, calendar: Calendar) {}
}
