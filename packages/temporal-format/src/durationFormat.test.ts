import { Duration } from 'temporal-ponyfill'
import { DurationFormat } from './durationFormat'

test.each([
  [
    new Duration(1),
    [
      {
        type: 'integer',
        value: '1',
        unit: 'year',
      },
      {
        type: 'literal',
        value: ' year',
      },
    ],
  ],
  [
    new Duration(0, 1, 0, 1),
    [
      {
        type: 'integer',
        value: '1',
        unit: 'month',
      },
      {
        type: 'literal',
        value: ' month',
      },
      {
        type: 'literal',
        value: ' ',
      },
      {
        type: 'integer',
        value: '1',
        unit: 'day',
      },
      {
        type: 'literal',
        value: ' day',
      },
    ],
  ],
])('can formatToParts %s', (dur, expected) => {
  const formatter = new DurationFormat()
  expect(formatter.formatToParts(dur)).toEqual(expected)
})

test.each([
  [new Duration(1), '1 year'],
  [new Duration(0, 1, 0, 1), '1 month 1 day'],
])('can formatToParts %s', (dur, expected) => {
  const formatter = new DurationFormat()
  expect(formatter.format(dur)).toEqual(expected)
})
