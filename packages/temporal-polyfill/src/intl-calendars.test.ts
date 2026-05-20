import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { Temporal } from './classApi/temporal'
import * as PlainDateFns from './funcApi/shim/plainDate'

const addonRequiredMessage = 'calendar requires temporal-polyfill/calendars'

describe('intl calendar addon', () => {
  it('keeps core limited to iso8601 and gregory', () => {
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

    expect(errors).toEqual(Array(8).fill(addonRequiredMessage))
  })

  it('enables class and function APIs with a side-effect import', async () => {
    await import('./intl-calendars')

    const classDate = Temporal.PlainDate.from({
      calendar: 'hebrew',
      year: 5784,
      month: 7,
      day: 1,
    })
    const functionDate = PlainDateFns.create(2024, 1, 1, 'buddhist')

    expect(classDate.calendarId).toBe('hebrew')
    expect(functionDate.calendarId).toBe('buddhist')
    expect(functionDate.year).toBe(2567)
  })

  it('marks the addon export as side-effectful build output', () => {
    const manifest = JSON.parse(readFileSync('./package.json', 'utf8'))

    expect(manifest.buildConfig.exports['./intl-calendars']).toMatchObject({
      iife: true,
      src: 'intl-calendars',
    })
  })
})
