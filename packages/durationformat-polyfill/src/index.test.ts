import { Duration } from 'temporal-polyfill'
import { DurationFormat } from './index'

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
    new Duration(3),
    [
      {
        type: 'integer',
        value: '3',
        unit: 'year',
      },
      {
        type: 'literal',
        value: ' years',
      },
    ],
  ],
  [
    new Duration(0, 0, 0, 0, 0, 52),
    [
      {
        type: 'integer',
        value: '52',
        unit: 'minute',
      },
      {
        type: 'literal',
        value: ' minutes',
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
  [new Duration(0, 0, 1, 5), '1 week 5 days'],
])('can formatToParts %s', (dur, expected) => {
  const formatter = new DurationFormat()
  expect(formatter.format(dur)).toEqual(expected)
})
