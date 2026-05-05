import { execFileSync } from 'child_process'
import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'

const addonRequiredMessage = 'calendar requires temporal-polyfill/calendars'

function runNode(code: string): string {
  return execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
}

describe('intl calendar addon', () => {
  it('keeps core limited to iso8601 and gregory', () => {
    const output = runNode(`
      const { Temporal } = await import('./dist/index.js')
      const PlainDateFns = await import('./dist/fns/plaindate.js')
      const ids = ['buddhist', 'roc', 'japanese', 'hebrew']
      const errors = []

      new Temporal.PlainDate(2024, 1, 1, 'iso8601')
      new Temporal.PlainDate(2024, 1, 1, 'gregory')
      PlainDateFns.create(2024, 1, 1, 'iso8601')
      PlainDateFns.create(2024, 1, 1, 'gregory')

      for (const id of ids) {
        try {
          new Temporal.PlainDate(2024, 1, 1, id)
        } catch (error) {
          errors.push(error instanceof RangeError && error.message)
        }

        try {
          PlainDateFns.create(2024, 1, 1, id)
        } catch (error) {
          errors.push(error instanceof RangeError && error.message)
        }
      }

      console.log(JSON.stringify(errors))
    `)

    expect(JSON.parse(output)).toEqual(Array(8).fill(addonRequiredMessage))
  })

  it('enables class and function APIs with a side-effect import', () => {
    const output = runNode(`
      const { Temporal } = await import('./dist/index.js')
      const PlainDateFns = await import('./dist/fns/plaindate.js')
      await import('./dist/intl-calendars.esm.js')

      const classDate = Temporal.PlainDate.from({
        calendar: 'hebrew',
        year: 5784,
        month: 7,
        day: 1,
      })
      const functionDate = PlainDateFns.create(2024, 1, 1, 'buddhist')

      console.log(JSON.stringify([
        classDate.calendarId,
        functionDate.calendarId,
        functionDate.year,
      ]))
    `)

    expect(JSON.parse(output)).toEqual(['hebrew', 'buddhist', 2024])
  })

  it('reports concrete DateTimeFormat fallbacks for islamic calendar aliases', () => {
    const output = runNode(`
      const { Intl, Temporal } = await import('./dist/index.js')
      await import('./dist/intl-calendars.esm.js')

      const fallbackCalendars = [
        'islamic-civil',
        'islamic-tbla',
        'islamic-umalqura',
      ]
      const calendars = [
        new Intl.DateTimeFormat('en', {
          calendar: 'islamic',
        }).resolvedOptions().calendar,
        new Intl.DateTimeFormat('en', {
          calendar: 'islamic-rgsa',
        }).resolvedOptions().calendar,
        new Intl.DateTimeFormat('en-u-ca-islamic').resolvedOptions().calendar,
        new Intl.DateTimeFormat('en-u-ca-islamic-rgsa').resolvedOptions()
          .calendar,
      ]
      const fallbackCalendar = calendars[2]
      const date = Temporal.PlainDate.from({
        calendar: fallbackCalendar,
        year: 1445,
        month: 6,
        day: 19,
      })
      const formatted = [
        new Intl.DateTimeFormat('en-u-ca-islamic', {
          year: 'numeric',
        }).format(date),
        date.toLocaleString('en-u-ca-islamic', { year: 'numeric' }),
      ]

      console.log(JSON.stringify({
        calendars: calendars.map((id) => fallbackCalendars.includes(id)),
        formatted: formatted.map((value) => typeof value === 'string' && !!value),
      }))
    `)

    expect(JSON.parse(output)).toEqual({
      calendars: [true, true, true, true],
      formatted: [true, true],
    })
  })

  it('marks addon artifacts as side-effectful in the package manifest', () => {
    const manifest = JSON.parse(readFileSync('./dist/package.json', 'utf8'))

    expect(manifest.sideEffects).toEqual(
      expect.arrayContaining([
        './intl-calendars.cjs',
        './intl-calendars.esm.js',
        './intl-calendars.js',
        './intl-calendars.min.js',
      ]),
    )
  })
})
