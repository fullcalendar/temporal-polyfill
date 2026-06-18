// Low-Level
export const expectedPositive = (entityName: string, num: number) =>
  `Non-positive ${entityName}: ${num}`
export const expectedFinite = (entityName: string, num: number) =>
  `Non-finite ${entityName}: ${num}`
export const forbiddenBigIntToNumber = (entityName: string) =>
  `Cannot convert bigint to ${entityName}`
export const invalidObject = 'Invalid object'

export const numberOutOfRange = (
  entityName: string,
  val: number | string,
  min: number | string,
  max: number | string,
): string => invalidEntity(entityName, val) + `; must be between ${min}-${max}`

// Entity/Fields/Bags
export const invalidEntity = (fieldName: string, val: any) =>
  `Invalid ${fieldName}: ${val}`

// Calendar
export const unsupportedWeekNumbers = 'Calendar week operations forbidden'

// Rounding
export const nonOneRoundingIncrement = 'Non-1 roundingIncrement not allowed'

// Options
export const invalidOverflowOption = 'Invalid overflow option'
