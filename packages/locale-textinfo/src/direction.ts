export const getDirection = (locale: string): 'ltr' | 'rtl' => {
  return locale.match(/^(ar-dz|ar-kw|ar-ly|ar-ma|ar-sa|ar-tn|ar|fa|he)$/)
    ? 'rtl'
    : 'ltr'
}
