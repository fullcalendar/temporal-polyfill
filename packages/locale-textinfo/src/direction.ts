export const getDirection = (locale: string): 'ltr' | 'rtl' => {
  return locale.match(/^((?:ar|fa|he)-?\w*)$/)
    ? 'rtl'
    : 'ltr'
}
