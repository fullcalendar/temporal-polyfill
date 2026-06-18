import { getLocaleTextInfo } from './index'

test.each`
  locale     | direction
  ${'af'}    | ${'ltr'}
  ${'ar'}    | ${'rtl'}
  ${'en-au'} | ${'ltr'}
  ${'gu'}    | ${'ltr'}
`('can get locale($locale) direction($direction)', ({ locale, direction }) => {
  expect(getLocaleTextInfo(locale)).toEqual({ direction })
})
