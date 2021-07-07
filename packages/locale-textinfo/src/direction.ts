/* eslint-disable */

export const getDirection = (locale: string): 'ltr' | 'rtl' => {
  return locale.match(/^((?:ar|fa|he)(?:-\w{2})?)$/)
    ? 'rtl'
    : 'ltr'
}
