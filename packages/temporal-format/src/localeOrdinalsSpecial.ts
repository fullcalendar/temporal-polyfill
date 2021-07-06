export const localOrdinalsSpecial: {
  [key: string]: (
    ordinalData: unknown,
    unit: string | number, // TODO: What should this actually associate with?
    pluralRule: Intl.LDMLPluralRule
  ) => string
} = {
  fr: (
    ordinalData: {
      m: string
      f: string
    },
    unit
  ) => {
    return unit === 1 ? 'e' : ordinalData[unit === 'day' ? 'm' : 'f']
  },
}
