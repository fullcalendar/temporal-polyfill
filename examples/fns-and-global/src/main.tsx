import { render } from 'preact'
import { useMemo } from 'preact/hooks'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as PlainMonthDayFns from 'temporal-polyfill/fns/PlainMonthDay'

import { BirthdayCountdown } from './BirthdayCountdown.tsx'
import './styles.css'

// for testing temporal-polyfill shim implementation
import 'temporal-polyfill/implementation'

function randomIntInclusive(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function App() {
  const birthday = useMemo(
    () =>
      PlainMonthDayFns.create(
        randomIntInclusive(1, 12),
        randomIntInclusive(1, 28),
      ),
    [],
  )

  return (
    <main>
      <h1>Birthday Countdown</h1>
      <p>Your pretend birthday is {PlainMonthDayFns.toString(birthday)}.</p>
      <BirthdayCountdown
        birthday={birthday}
        debug // will console.log the fns API's Record
        onDateClick={(info) => {
          console.log('App clicked info')
          console.log('----------------')
          console.log('dateString', info.dateString)
          console.log('plainDate', info.plainDate)
          console.log('plainDateTime', info.plainDateTime)
          console.log('zonedDateTime', info.zonedDateTime)
          console.log('legacyDate', info.legacyDate)
        }}
      />
    </main>
  )
}

render(<App />, document.getElementById('app')!)
