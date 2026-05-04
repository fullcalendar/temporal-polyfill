import { intlCalendarProvider } from './externalCalendars/intlCalendarProvider'
import { registerExternalCalendarProvider } from './internal/externalCalendar'

registerExternalCalendarProvider(intlCalendarProvider)
