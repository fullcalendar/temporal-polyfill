export const localeOrdinalsSpecial: {
  [key: string]: (
    ordinalData: any,
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
    num: number,
    unit: string,
  ): string => {
    return num === 1 ? 'e' : ordinalData[unit === 'day' ? 'm' : 'f']
  },
}
