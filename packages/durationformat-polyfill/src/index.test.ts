import { Duration } from 'temporal-polyfill'
import { DurationFormat } from './index'

test.each`
  dur | expected
  ${new Duration(1)} | ${[{
    type: 'integer',
    value: '1',
    unit: 'year',
  }, {
    type: 'literal',
    value: ' year',
  }]}
  ${new Duration(3)} | ${[{
    type: 'integer',
    value: '3',
    unit: 'year',
  }, {
    type: 'literal',
    value: ' years',
  }]}
  ${new Duration(0, 0, 0, 0, 0, 52)} | ${[{
    type: 'integer',
    value: '52',
    unit: 'minute',
  }, {
    type: 'literal',
    value: ' minutes',
  }]}
  ${new Duration(0, 1, 0, 1)} | ${[{
    type: 'integer',
    value: '1',
    unit: 'month',
  }, {
    type: 'literal',
    value: ' month',
  }, {
    type: 'literal',
    value: ' and ',
  }, {
    type: 'integer',
    value: '1',
    unit: 'day',
  }, {
    type: 'literal',
    value: ' day',
  }]}
`('can formatToParts $dur', ({ dur, expected }) => {
  const formatter = new DurationFormat()
  expect(formatter.formatToParts(dur)).toEqual(expected)
})

test.each`
  dur                                     | expected
  ${new Duration(0, 1, 0, 1)}             | ${'1 month and 1 day'}
  ${new Duration(0, 0, 1, 5)}             | ${'1 week and 5 days'}
  ${new Duration(2, 2, 2, 2, 2, 2, 2, 2)} | ${'2 years, 2 months, 2 weeks, 2 days, 2 hours, 2 minutes, and 2 seconds'}
`('can format $dur', ({ dur, expected }) => {
  const formatter = new DurationFormat()
  expect(formatter.format(dur)).toEqual(expected)
})

test.each`
  dur                                | locale  | expected
  ${new Duration(1, 1, 1)}           | ${'fr'} | ${'1 an, 1 mois et 1 semaine'}
  ${new Duration(0, 0, 0, 0, 1, 10)} | ${'es'} | ${'1 hora y 10 minutos'}
  ${new Duration(0, 2, 0, 5)}        | ${'ja'} | ${'2 か月、5 日'}
`(`can format $dur using '$locale'`, ({ dur, locale, expected }) => {
  const formatter = new DurationFormat(locale)
  expect(formatter.format(dur)).toEqual(expected)
})
