import { render } from 'preact'
import { BirthdayCountdown } from './BirthdayCountdown.tsx'
import { allCalendars } from './calendarPlugin.ts'
import './styles.css'
import 'temporal-polyfill/global'

function App() {
  return (
    <main>
      <h1>Birthday Countdown</h1>
      <BirthdayCountdown
        debug // will console.log the fns API's Record
        calendarPlugin={allCalendars}
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
