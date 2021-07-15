export const localeOrdinalsSpecial: {
  [key: string]: (
    ordinalData: unknown,
    num: number,
    unit: string,
    pluralRule: Intl.LDMLPluralRule
  ) => string
} = {
  fr: (
    ordinalData: {
      m: string
      f: string
    },
    num,
    unit
  ) => {
    return num === 1 ? 'e' : ordinalData[unit === 'day' ? 'm' : 'f']
  },
}
