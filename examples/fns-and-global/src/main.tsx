import { render } from 'preact'
import { BirthdayCountdown } from './BirthdayCountdown.tsx'
import './styles.css'

/*
import { basicCalendars as calendarPlugin } from './calendarPlugin.ts'
import 'temporal-polyfill/global' // basic entrypoint
*/

/*
import { gregoryAlignedCalendars as calendarPlugin } from './calendarPlugin.ts'
import 'temporal-polyfill/full/global'
*/

import { allCalendars as calendarPlugin } from './calendarPlugin.ts'
import 'temporal-polyfill/full/global'

function App() {
  return (
    <main>
      <h1>Birthday Countdown</h1>
      <BirthdayCountdown
        debug // will console.log the fns API's Record
        calendarPlugin={calendarPlugin}
        onDateClick={(info) => {
          console.log('--------------------')
          console.log('onDateClick callback')
          console.log('--------------------')
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
