import * as baseErrorMessages from 'temporal-utils/protected-error-messages'

export const invalidEntity = baseErrorMessages.invalidEntity
export const unsupportedWeekNumbers = baseErrorMessages.unsupportedWeekNumbers

// Low-Level
export const expectedInteger = (entityName: string, num: number) =>
  `Non-integer ${entityName}: ${num}`
export const invalidBigInt = (arg: any) => `Invalid bigint: ${arg}`
export const forbiddenSymbolToString = 'Cannot convert Symbol to string'
export const forbiddenNullish = 'Cannot be null or undefined'

export const numberOutOfRangeWithChoices = (
  entityName: string,
  val: number | string,
  min: number | string,
  max: number | string,
  choices?: string[],
): string =>
  choices
    ? baseErrorMessages.numberOutOfRange(
        entityName,
        choices[val as number],
        choices[min as number],
        choices[max as number],
      )
    : baseErrorMessages.numberOutOfRange(entityName, val, min, max)

// Entity/Fields/Bags
export const missingField = (fieldName: string) => `Missing ${fieldName}`
export const noValidFields = (validFields: string[]) =>
  'No valid fields: ' + validFields.join()
export const invalidBag = 'Invalid bag'

export const invalidChoice = (
  fieldName: string,
  val: string,
  choiceMap: Record<string, number>,
) =>
  baseErrorMessages.invalidEntity(fieldName, val) +
  '; must be ' +
  Object.keys(choiceMap).join()

// Class-related
export const forbiddenValueOf = 'Cannot use valueOf'
export const invalidCallingContext = 'Invalid calling context'

// Calendar Fields/Parts
export const forbiddenEraParts = 'Forbidden era/eraYear'
export const mismatchingEraParts = 'Mismatching era/eraYear'
export const mismatchingYearAndEra = 'Mismatching year/eraYear'
export const invalidEra = (era: string) => `Invalid era: ${era}`
export const missingYear = (allowEra: any) =>
  `Missing year${allowEra ? '/era/eraYear' : ''}`
export const invalidMonthCode = (monthCode: string) =>
  `Invalid monthCode: ${monthCode}`
export const mismatchingMonthAndCode = 'Mismatching month/monthCode'
export const missingMonth = 'Missing month/monthCode'
export const failedYearGuess = 'Cannot guess year'
export const invalidLeapMonth = 'Invalid leap month'

// Calendar
export const invalidCalendar = (calendarId: string) =>
  baseErrorMessages.invalidEntity('Calendar', calendarId)
export const exoticCalendarRequired = (calendarId: string, remedy: string) =>
  `Unknown calendar ${calendarId}; might need ${remedy}`
export const mismatchingCalendars = 'Mismatching Calendars'

// TimeZone
export const invalidTimeZone = (calendarId: string) =>
  baseErrorMessages.invalidEntity('TimeZone', calendarId)
export const mismatchingTimeZones = 'Mismatching TimeZones'
export const forbiddenIcuTimeZone = 'Forbidden ICU TimeZone'

// TimeZone Offset/Gap
export const outOfBoundsOffset = 'Out-of-bounds offset'
export const outOfBoundsDstGap = 'Out-of-bounds TimeZone gap'
export const invalidOffsetForTimeZone = 'Invalid TimeZone offset'
export const ambigOffset = 'Ambiguous offset'

// Date/Duration Math
export const outOfBoundsDate = 'Out-of-bounds date'
export const outOfBoundsDuration = 'Out-of-bounds duration'
export const forbiddenDurationSigns = 'Cannot mix duration signs'
export const missingRelativeTo = 'Missing relativeTo'
export const invalidRelativeTo = (arg: unknown) =>
  invalidEntity('relativeTo', arg)
export const invalidLargeUnits = 'Cannot use large units' // for Instant math
export const invalidSmallUnits = 'Cannot use small units'

// Options Refining
export const missingSmallestLargestUnit = 'Required smallestUnit or largestUnit'
export const flippedSmallestLargestUnit = 'smallestUnit > largestUnit'

// Parsing
export const failedParse = (s: string) => `Cannot parse: ${s}`
export const invalidSubstring = (substring: string) =>
  `Invalid substring: ${substring}`

// Formatting
export const invalidFormatOptions = 'Invalid formatting options'
export const invalidFormatType = (branding: string) =>
  `Cannot format ${branding}`
export const mismatchingFormatTypes = 'Mismatching types for formatting'
export const forbiddenFormatTimeZone = 'Cannot specify TimeZone'
