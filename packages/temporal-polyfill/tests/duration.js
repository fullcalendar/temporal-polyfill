import { describe, expect, test } from 'vitest'
import * as DurationFns from '../dist/fns/duration.esm.js'

describe('create', () => {
  test('creates basic slots', () => {
    const duration = DurationFns.create()
    expect(Object.keys(duration)).toEqual([
      'branding',
      'days',
      'hours',
      'microseconds',
      'milliseconds',
      'minutes',
      'months',
      'nanoseconds',
      'seconds',
      'weeks',
      'years',
    ])
  })
})
