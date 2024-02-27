import { describe, it } from 'vitest'
import * as PlainDateFns from './plainDate'
import { expectPlainDateEquals } from './testUtils'

describe('create', () => {
  it('works', () => {
    const pd = PlainDateFns.create(2024, 1, 1, 'hebrew')
    expectPlainDateEquals(pd, {
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      calendar: 'hebrew',
    })
  })
})

describe('fromString', () => {
  it('works', () => {
    const pd = PlainDateFns.fromString('2024-01-01[u-ca=hebrew]')
    expectPlainDateEquals(pd, {
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      calendar: 'hebrew',
    })
  })
})

describe('fromFields', () => {
  it('works', () => {
    const pd = PlainDateFns.fromFields({
      year: 5784,
      month: 4,
      day: 20,
      calendar: 'hebrew',
    })
    expectPlainDateEquals(pd, {
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      calendar: 'hebrew',
    })
  })
})
