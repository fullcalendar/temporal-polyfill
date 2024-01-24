
// Low-Level
export const expectedInteger = (entityName: string, num: number) => `Non-integer ${entityName}: ${num}`
export const expectedPositive = (entityName: string, num: number) => `Non-positive ${entityName}: ${num}`
export const expectedFinite = (entityName: string, num: number) => `Non-finite ${entityName}: ${num}`
export const forbiddenBigIntToNumber = (entityName: string) => `Cannot convert bigint to ${entityName}`
export const invalidBigInt = (arg: any) => `Invalid bigint: ${arg}`
export const forbiddenSymbolToString = 'Cannot convert Symbol to string'
export const forbiddenNullish = 'Cannot be null or undefined'
export const expectedStringOrUndefined = 'Expected string or undefined'
export const expectedIntegerOrUndefined = 'Expected integer or undefined'
export const invalidObject = 'Invalid object'
export const numberOutOfRange = (entityName: string, val: number, min: number, max: number) => (
  `${entityName} ${val} must be between ${min}-${max}`
)

// Entity/Fields/Bags
export const invalidEntity = (fieldName: string, val: any) => `Invalid ${fieldName}: ${val}`
export const missingField = (fieldName: string) => `Missing ${fieldName}`
export const forbiddenField = (fieldName: string) => `Invalid field ${fieldName}`
export const duplicateFields = (fieldName: string) => `Duplicate field ${fieldName}`
export const noValidFields = 'No valid fields'
export const invalidBag = 'Invalid bag'

// Class-related
export const forbiddenValueOf = 'Cannot use valueOf'
export const invalidCallingContext = 'Invalid calling context'

// Calendar Fields/Parts
export const forbiddenEraParts = 'Forbidden era/eraYear'
export const mismatchingEraParts = 'Mismatching era/eraYear'
export const mismatchingYearAndEra = 'Mismatching year/eraYear'
export const invalidEra = (era: string) => `Invalid era: ${era}`
export const missingYear = (allowEra: any) => `Missing year${allowEra ? '/era/eraYear' : ''}`
export const invalidMonthCode = (monthCode: string) => `Invalid monthCode: ${monthCode}`
export const mismatchingMonthAndCode = 'Mismatching month/monthCode'
export const missingMonth = 'Missing month/monthCode'
export const failedYearGuess = 'Cannot guess year'
export const invalidLeapMonth = 'Invalid leap month'

// Calendar/TimeZone-PROTOCOL (very vague, I know, but rare)
export const invalidProtocol = 'Invalid protocol'
export const invalidProtocolResults = 'Invalid protocol results'

// Calendar/TimeZone
export const invalidCalendar = (calendarId: string) => `Invalid Calendar: ${calendarId}`
export const mismatchingCalendars = 'Mismatching Calendars'
export const mismatchingTimeZones = 'Mismatching TimeZones'

// TimeZone Offset
export const outOfBoundsOffset = 'Out-of-bounds offset'
export const invalidOffsetForTimeZone = 'Invalid offset for TimeZone'
export const ambigOffset = 'Ambiguous offset'

// Date/Duration Math
export const outOfBoundsDate = 'Out-of-bounds date'
export const forbiddenDurationSigns = 'Cannot mix duration signs'
export const missingRelativeTo = 'Missing relativeTo'
export const invalidLargeUnits = 'Cannot use large units' // for Instant math

// Options Refining
export const missingSmallestLargestUnit = 'Required smallestUnit or largestUnit'
export const flippedSmallestLargestUnit = 'smallestUnit > largestUnit'

// Parsing
export const failedParse = (s: string) => `Cannot parse: ${s}`
export const invalidSubstring = (substring: string) => `Invalid substring: ${substring}`

// Formatting
export const invalidFormatType = (branding: string) => `Cannot format ${branding}`
export const mismatchingFormatTypes = 'Mismatching types for formatting'
export const forbiddenFormatTimeZone = 'Forbidden timeZone'