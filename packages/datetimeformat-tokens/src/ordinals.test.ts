import { getOrdinalForValue } from './ordinals'

test.each`
  locale     | num  | unit     | expected
  ${'et'}    | ${1} | ${'day'} | ${'.'}
  ${'es'}    | ${1} | ${'day'} | ${'º'}
  ${'en'}    | ${1} | ${'day'} | ${'st'}
  ${'en'}    | ${2} | ${'day'} | ${'nd'}
  ${'en-us'} | ${1} | ${'day'} | ${'st'}
  ${'fr'}    | ${1} | ${'day'} | ${'e'}
  ${'fr'}    | ${2} | ${'day'} | ${'er'}
`(
  'can get ordinal for \'$locale\' to be \'$expected\'',
  ({ locale, num, unit, expected }) => {
    expect(getOrdinalForValue(num, unit, locale)).toBe(expected)
  },
)
