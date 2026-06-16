import { useState } from 'preact/hooks'
import * as NowFns from 'temporal-polyfill/fns/Now'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as PlainMonthDayFns from 'temporal-polyfill/fns/PlainMonthDay'
import * as PlainYearMonthFns from 'temporal-polyfill/fns/PlainYearMonth'

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
  birthday: PlainMonthDayFns.Record
  debug?: boolean
  onDateClick?: (info: DateClickInfo) => void
}

const dateFormat = PlainDateFns.createFormat(undefined, {
  dateStyle: 'full',
})

function getCurrentMonthDates(): PlainDateFns.Record[] {
  const today = NowFns.plainDateISO()
  const currentMonth = PlainDateFns.toPlainYearMonth(today)
  const daysInMonth = PlainYearMonthFns.daysInMonth(currentMonth)

  return Array.from({ length: daysInMonth }, (_unused, index) =>
    PlainDateFns.create(currentMonth.year, currentMonth.month, index + 1),
  )
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
  birthday,
  debug = false,
  onDateClick,
}: BirthdayCountdownProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string>()
  const dates = getCurrentMonthDates()

  function handleDateClick(date: PlainDateFns.Record) {
    const dateString = PlainDateFns.toString(date)
    setSelectedDateKey(dateString)

    if (debug) {
      console.log(
        'BirthdayCountdown clicked date Record:',
        date, // direct Record object
      )
    }

    onDateClick?.({
      dateString,
      get plainDate() {
        return dateToPlainDate(date)
      },
      get plainDateTime() {
        return dateToPlainDateTime(date)
      },
      get zonedDateTime() {
        return dateToZonedDateTime(date)
      },
      get legacyDate() {
        return dateToLegacyDate(date)
      }
    })
  }

  return (
    <section>
      <h2>Current Month</h2>
      <ul>
        {dates.map((date) => {
          const dateKey = PlainDateFns.toString(date)
          const daysUntilBirthday = getDaysUntilBirthday(date, birthday)

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

// Utils
// -----------------------------------------------------------------------------

function dateToPlainDate(date: PlainDateFns.Record): Temporal.PlainDate {
  return new Temporal.PlainDate(...PlainDateFns.toISOArray(date))
}

function dateToPlainDateTime(date: PlainDateFns.Record): Temporal.PlainDateTime {
  return dateToPlainDate(date).toPlainDateTime()
}

function dateToZonedDateTime(date: PlainDateFns.Record): Temporal.ZonedDateTime {
  return dateToPlainDateTime(date).toZonedDateTime(Temporal.Now.timeZone())
}

// does not require Temporal
function dateToLegacyDate(date: PlainDateFns.Record): Date {
  const zdt = PlainDateFns.toZonedDateTime(date, NowFns.timeZone())
  return new Date(zdt.epochMilliseconds)
}
