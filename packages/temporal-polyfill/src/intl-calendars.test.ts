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
        functionDate.calendar?.id || 'iso8601',
        functionDate.year,
      ]))
    `)

    expect(JSON.parse(output)).toEqual(['hebrew', 'buddhist', 2024])
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
