import type { JSX } from 'preact'
import { useMemo, useState } from 'preact/hooks'
import type * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as NowFns from 'temporal-polyfill/fns/Now'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as PlainDateTimeFns from 'temporal-polyfill/fns/PlainDateTime'
import * as PlainMonthDayFns from 'temporal-polyfill/fns/PlainMonthDay'
import * as PlainYearMonthFns from 'temporal-polyfill/fns/PlainYearMonth'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'
import { CalendarPlugin } from './calendarPlugin'

/*
Exposes real Temporal objects lazily, but caller must support them
*/
type DateClickInfo = {
  dateString: string
  plainDate: Temporal.PlainDate
  plainDateTime: Temporal.PlainDateTime
  zonedDateTime: Temporal.ZonedDateTime
  legacyDate: Date
}

type BirthdayCountdownProps = {
  debug?: boolean
  calendarPlugin: CalendarPlugin
  onDateClick?: (info: DateClickInfo) => void
}

function randomIntInclusive(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getToday(calendar: CalendarFns.Record): PlainDateFns.Record {
  return PlainDateFns.withCalendar(NowFns.plainDateISO(), calendar)
}

function createRandomBirthday(calendar: CalendarFns.Record): PlainDateFns.Record {
  const today = getToday(calendar)

  // Pick a real date in the selected calendar's current year, so calendars
  // with leap months or non-Gregorian month lengths get valid birthdays.
  return PlainDateFns.withDayOfYear(
    today,
    randomIntInclusive(1, PlainDateFns.daysInYear(today)),
  )
}

function getCurrentMonthDates(
  calendar: CalendarFns.Record,
): PlainDateFns.Record[] {
  const currentMonthStart = PlainDateFns.startOfMonth(getToday(calendar))
  const currentMonth = PlainDateFns.toPlainYearMonth(currentMonthStart)
  const daysInMonth = PlainYearMonthFns.daysInMonth(currentMonth)

  return Array.from({ length: daysInMonth }, (_unused, index) =>
    PlainDateFns.addDays(currentMonthStart, index),
  )
}

// Match the Intl formatter calendar to the selected calendar. The fns formatter
// intentionally rejects mismatched calendars instead of silently formatting a
// Hebrew date with a Gregorian formatter, for example.
function createDateFormat(calendarId: string): PlainDateFns.Format {
  return PlainDateFns.createFormat(undefined, {
    calendar: calendarId,
    dateStyle: 'full',
  })
}

function getNextBirthday(
  date: PlainDateFns.Record,
  birthday: PlainMonthDayFns.Record,
): PlainDateFns.Record {
  const birthdayThisYear = PlainMonthDayFns.toPlainDate(birthday, {
    year: date.year,
  })

  if (PlainDateFns.compare(birthdayThisYear, date) >= 0) {
    return birthdayThisYear
  }

  return PlainMonthDayFns.toPlainDate(birthday, {
    year: date.year + 1,
  })
}

function getDaysUntilBirthday(
  date: PlainDateFns.Record,
  birthday: PlainMonthDayFns.Record,
): number {
  return PlainDateFns.diffDays(date, getNextBirthday(date, birthday))
}

export function BirthdayCountdown({
  debug = false,
  calendarPlugin,
  onDateClick,
}: BirthdayCountdownProps) {
  const [calendarId, setCalendarId] = useState(
    () => calendarPlugin.choices[0]?.id ?? 'iso8601',
  )
  const calendar = useMemo(
    () => calendarPlugin.getCalendarRecord(calendarId),
    [calendarId, calendarPlugin],
  )
  const [birthday, setBirthday] = useState(() => createRandomBirthday(calendar))
  const [selectedDateKey, setSelectedDateKey] = useState<string>()
  const dateFormat = useMemo(() => createDateFormat(calendarId), [calendarId])
  const birthdayMonthDay = PlainDateFns.toPlainMonthDay(birthday)
  const dates = getCurrentMonthDates(calendar)

  function handleCalendarChange(event: JSX.TargetedEvent<HTMLSelectElement>) {
    const nextCalendarId = event.currentTarget.value
    const nextCalendar = calendarPlugin.getCalendarRecord(nextCalendarId)

    setCalendarId(nextCalendarId)
    setBirthday(createRandomBirthday(nextCalendar))
    setSelectedDateKey(undefined)
  }

  function handleDateClick(date: PlainDateFns.Record) {
    const dateString = PlainDateFns.toString(date, { calendarName: 'always' })
    setSelectedDateKey(dateString)

    if (debug) {
      console.log('----------------')
      console.log('Internal Records')
      console.log('----------------')
      console.log('date', date)
      console.log('birthdayMonthDay', birthdayMonthDay)
      console.log('calendar', calendar)
    }

    onDateClick?.({
      dateString,
      get plainDate() {
        return PlainDateFns.toTemporal(date)
      },
      get plainDateTime() {
        return PlainDateTimeFns.toTemporal(PlainDateFns.toPlainDateTime(date))
      },
      get zonedDateTime() {
        return ZonedDateTimeFns.toTemporal(
          PlainDateFns.toZonedDateTime(date, NowFns.timeZoneId()),
        )
      },
      get legacyDate() {
        return new Date(
          PlainDateFns.toZonedDateTime(date, NowFns.timeZoneId())
            .epochMilliseconds,
        )
      },
    })
  }

  return (
    <section>
      <div className="calendar-controls">
        <label>
          Calendar system
          <select value={calendarId} onChange={handleCalendarChange}>
            {calendarPlugin.choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </select>
        </label>
        <p>Your pretend birthday is {dateFormat.format(birthday)}.</p>
      </div>
      <h2>Current Month</h2>
      <ul>
        {dates.map((date) => {
          const dateKey = PlainDateFns.toString(date, {
            calendarName: 'always',
          })
          const daysUntilBirthday = getDaysUntilBirthday(
            date,
            birthdayMonthDay,
          )

          return (
            <li key={dateKey}>
              <span>{dateFormat.format(date)}</span>
              <div className="date-actions">
                {selectedDateKey === dateKey ? (
                  <span className="countdown-message">
                    {daysUntilBirthday} days until my birthday.
                  </span>
                ) : null}
                <button type="button" onClick={() => handleDateClick(date)}>
                  Count days
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
