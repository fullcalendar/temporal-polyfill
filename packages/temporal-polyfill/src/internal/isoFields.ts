import { CalendarDateFields, TimeFields } from './fieldTypes'

export type IsoDateCarrier = { isoDate: CalendarDateFields }

export type TimeCarrier = { time: TimeFields }

export type IsoDateTimeCarrier = IsoDateCarrier & TimeCarrier
