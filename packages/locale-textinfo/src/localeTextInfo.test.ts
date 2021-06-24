import { getLocaleTextInfo } from './localeTextInfo'

test.each([
  ['af', 'ltr'],
  ['ar', 'rtl'],
  ['en-au', 'ltr'],
  ['gu', 'ltr'],
])('can get locale(%s) direction', (locale, direction) => {
  expect(getLocaleTextInfo(locale)).toEqual({ direction })
})
