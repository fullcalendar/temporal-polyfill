import { getOrdinalForValue } from './ordinals'

test.each([
  ['et', 1, 'day', '.'],
  ['es', 1, 'day', 'º'],
  ['en', 1, 'day', 'st'],
  ['en', 2, 'day', 'nd'],
  ['en-us', 1, 'day', 'st'],
  ['fr', 1, 'day', 'er'],
])(
  'can get ordinal for locale %s, number %s',
  (locale, num, unit, expected) => {
    expect(getOrdinalForValue(num, unit, locale)).toBe(expected)
  }
)
