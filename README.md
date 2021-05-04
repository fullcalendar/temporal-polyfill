
# Dateless

A new JavaScript date library

- [Why?](#why)
- [Getting started](#getting-started)
- [Comparison with other libs](#comparison-with-other-libs)
- [Browser support](#browser-support)
- [Types](#types)
- [Environment defaults](#environment-defaults)
- [Creating](#creating)
- [Normalizing](#normalizing)
- [Parsing](#parsing)
- [Formatting](#formatting)
- [Getting](#getting)
- [Setting](#setting)
- [Adding](#adding)
- [Subtracting](#subtracting)
- [Multiplying](#multiplying)
- [Diffing](#diffing)
- [Start-of](#start-of)
- [As-unit](#as-unit)
- [Comparing](#comparison-with-other-libs)
- [Converting](#converting)
- [ESLint Plugin](#eslint-plugin)

## Why?

Why does the world need another JavaScript date library? I was inspired by a series of bugs encountered while developing [FullCalendar]. Imagine the following scenario: you need to print out each hour for the next 24 hours. You might write:

```js
// compute the star of the current hour
let date = new Date()
date.setMinutes(0)
date.setSeconds(0)
date.setMilliseconds(0)

// compute 24 hours later
let endDate = new Date(date.valueOf()) // clone date
endDate.setHours(date.getHours() + 24)

while (date.valueOf() < endDate.valueOf()) {
  console.log(
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0')
  )
  date.setHours(date.getHours() + 1)
}
```

If you ran your program at 22:30 (10:30pm), you would expect the following:

```
22:00
23:00
00:00
01:00
02:00
...etc...
21:00
```

However, in certain timezones and in certain browsers, you would be surprised:

```
scenario 1     scenario 2     scenario 3
22:00          22:00          22:00
23:00          23:00          23:00
00:00          00:00          00:00
00:00 (!)      02:00 (!)      01:00
02:00          03:00          01:00
...etc...      ...etc...      01:00  
21:00          21:00          (infinite loop!)
```

This is due to the fact our program is running in whatever local time zone the end-user is in. Each local zone has its own DST rules. DST rules cause certain hours of time to omitted or double-added. Certain browsers handle these omissions and additions differently.

A time zone with no DST:

```
           2017                                         2018
------------+--------------------------------------------+----------
```

A time zone with DST:

```
           2017                                         2018
------------+-----------                      -----------+----------
                         ----------------------
                        ^                     ^
                   missing hour           extra hour
```

If you iterate over dates/times using the browser's local time zone, you are setting yourself up for unpredictability and disaster. It's like a train riding along tracks that have a random stretch of track uprooted and shifted a few feet.

![Image of a train wreck](https://westernnews.media.clients.ellingtoncms.com/img/photos/2018/06/06/Train_t670.JPG?b3f6a5d7692ccc373d56e40cf708e3fa67d9af9d)

What's the solution? Operate in UTC instead, which is guaranteed not to have DST and which operates across all browsers consistently. Our modified example:

```js
// coerce current local date to UTC
let localDate = new Date()
let date = new Date(
  localDate.getYear(),
  localDate.getMonth(),
  localDate.getDate(),
  0, 0, 0, 0
) 

// compute 24 hours later
let endDate = new Date(date.valueOf())
endDate.setUTCHours(date.getUTCHours() + 24)

while (date.valueOf() < endDate()) {
  console.log(
    String(date.getUTCHours()).padStart(2, '0') + ':' +
    String(date.getUTCMinutes()).padStart(2, '0')
  )
  date.setUTCHours(date.getUTCHours() + 1)
}
```

We must remember to use the UTC-style methods instead. Most third-party date libraries have a more clever way to do this. They have UTC "mode":

```js
// dayjs
dayjs().tz('UTC').format()

// luxon
new DateTime().setZone('UTC').format()

// date-fns
import { format } from 'date-fns/utc'
format(new Date())
```

However, there is no way to enforce using UTC-related methods when doing date manipulation. There's no way to guarantee the following best practice:

```
create/parse ----> manipulate ----> format
 (with tz)        (without tz)     (with tz)
```

Dateless takes a different approach. Its API completely sidesteps using time zones (and DST) for during date manipulation. See the "Getting Started" examples...

# Getting Started

Install the lib:

```
npm install --save dateless
```

Then import it and write you program. The following program prints each hour for the next 24 hours:

```js
import { parseNow, addDays, addHours, formatIntl } from 'dateless'

let marker = parseNow()
let endMarker = addDays(marker, 1)

while (marker < endMarker) {
  console.log(
    formatIntl(marker, { timeStyle: 'short' })
  )
  marker = addHours(marker, 1)
}
```

You might say it's similar to [date-fns] in its function-based approach, but instead of leveraging the built-in [Date object] it leverages a date "marker", which is just an integer. It's an integer that represent chronology in a zone-less UTC-like mode. Its bulletproof for date manipulation.

## Comparison with other libs

Aside from being better for date manipulation, Dateless is better than other date libraries in a few other regards. Let's compare it to [Luxon], [Date-fns], and [Dayjs].

### 1) Other calendar systems

The 12-month "gregorian" calendar system that most of the world uses is not the only calendar system. There are others like "buddhist", "chinese", "coptic", and "ethiopia". Most date libraries allow you to string-format to another calendar system but none of them allow date manipulation. For example, you won't be able to print the first day in each month in the Jalali (aka Persion) calendar. You'll need to use a hard fork such as [jalaliday](https://github.com/alibaba-aero/jalaliday) (for dayjs) or [date-fns-jalali](https://github.com/date-fns-jalali/date-fns-jalali) (for date-fns).

### 2) No external locale files

Most libraries require you to import external files for formatting in a locale other than en-US. 

### 3) Tree-shakeable

Date libraries either take a function-based approach, like date-fns, or an object-based approach, like dayjs and Luxon. A function-based approach allows your bundler to automatically remove unnused functions, resulting in smaller bundler sizes.

### 4) Ease of installation

Some libraries are easier to install and import than others. Date-fns is a bit awkward because there are multiple entrypoints you can import functions from (`date-fns`, `date-fns/addDays`, `date-fns/utc`, `date-fns/utc/addDays`, `date-fns/fp`, etc). Dayjs can be clunky because each plugin is imported globally, and if you stop using a certain plugin's functionality, you must remember to unregister it.

### 5) Familiarity

No third-party date library is identical to the built-in Date object, but the more similar it is the less learning is required. The less custom objects the better. Naming conventions for methods and proprerties are also part of the equation.

### 6) Chainable

Many people prefer chainable APIs like `dayjs().startOf('day').add(1, 'hour).format()`

### Results

Here's how the libraries stack up:

<table>
  <thead>
    <tr><th></th><th>Dateless</th><th>Luxon</th><th>Date-fns</th><th>Dayjs</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Other calendar systems</td>
      <td>yes</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>No external locale files</td>
      <td>yes</td>
      <td>yes</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>Tree-shakeable</td>
      <td>yes</td>
      <td></td>
      <td>yes</td>
      <td></td>
    </tr>
    <tr>
      <td>Ease of installation</td>
      <td>yes</td>
      <td>yes</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>Familiarity</td>
      <td>yes</td>
      <td></td>
      <td>yes</td>
      <td></td>
    </tr>
    <tr>
      <td>Chainable</td>
      <td></td>
      <td></td>
      <td></td>
      <td>yes</td>
    </tr>
  </tbody>
</table>

## Browser support

Dateless is able to achieve its small footprint and simple API due to its reliance on the Intl API. As a result, the following browers are NOT supported:

- IE (any version)
- Safari < 14 (though a small shim is provided for lower versions)

Dateless uses a number of clever tricks to avoid needing a fully implemented Intl API.

## Types

A "date marker" is simply a number. The `DateMarker` type is an optional alias for readability:

```ts
type DateMarker = number
```

A duration represents a length of time:

```ts
interface Duration {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}
```

A more flexible duration object is allowed as input for all duration-related functions:

```ts
interface LooseDuration {
  years?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
}
```

All locales are represented as simple strings:

```ts
type Locale = string // like 'en-US'
```

All time zones are represented as IANA strings. There are special cases for UTC and local time:

```ts
type TimeZone = 'UTC' | 'local' | string // like 'America/New_York'
```

A calendar system is a simple string. The same type of string [DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) accepts:

```ts
type Calendar = string // like 'buddhist' or 'chinese'
```

## Environment defaults

Many of the functions Dateless provides accept `timeZone`, `locale`, and `calendar` paremeters. If these are not specified, certain defaults are used:

- `timeZone` - defaults to the browser's
- `locale` - defaults to browser's
- `calendar` - defaults to `'gregory'` for date manipulation, defaults for browser's for string-formatting

### `getDefaults`

Returns the current defaults that will be used across the API.

```ts
getDefaults(): {
  timeZone: string,
  locale: string,
  calendar: string,
}
```

### `setDefaults`

Resets the the environmental defaults. All function calls that use these parameters will leverage the new defaults going forward.

```ts
setDefaults(defaults: {
  timeZone?: string,
  locale?: string,
  calendar?: string,
}): void
```

This function is not recommended when creating distributable libraries.

### `setLocalDefaults`

Certain string-formatting functions that rely on tokens such as `formatStr` and `formatRangeStr` can have their default month/weekday strings changed for certain locales. This takes effect globally:

```ts
setLocaleDefaults(locale: string, localeDefaults: {
  months?: string[],
  monthsShort?: string[],
  monthsNarrow?: string[],
  weekdays?: string[],
  weekdaysShort?: string[],
  weekdaysNarrow?: string[],
}): void
```

### `getAvailableLocales`

Returns an array of locale names that have been verified to work well in all browsers. The browser might be capable of more. This is no an exhaustive list but rather an easy way to display a local-chooser to the end-user.

```ts
getAvailableLocales(): string[]
```

This method returns locale codes like `'en-US'`. To display a full locale name translated into an arbitrary language, use the `formatLocale` method.


## Creating

### `createMarker`

Creates a new marker from literal year/month/day/etc values.

```ts
createMarker(input: CreateMarkerInput, calendar?: string): number
```

Accepts:

```ts
type CreateMarkerInput =
  { year?: number,
    month?: number,
    monthDay?: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
    milliseconds?: number
  } |
  [ number?, number?, number?, number?, number?, number?, number? ]
```

## Normalizing

### `normalizeDuration`

Given a duration in the `LooseDuration` format, returns a stricter `Duration` object with guaranteed properties:

```ts
normalizeDuration(input: LooseDuration): Duration
```

### `normalizeLocale`

Given a list of potentially valid locale codes, returns the first recognized locale in a normalized form.

```ts
normalizeLocale(locale: string | string[]): string
```

## Parsing

Most of the time "parsing" means deriving meaning from a string, but in Dateless it also means converting from a different format into a DateMarker.

### `parseNow`

```ts
parseNow(): number
```

### `parseTimestamp`

```ts
parseTimestamp(timestamp: number): number
```

### `parseNative`

```ts
parseNative(dateObj: Date): number
```

### `parseIso`

```ts
parseIso(isoDateStr: string, timeZone?: string): number // like '2021-05-01T12:00:00Z'
```

### `parseDuration`

```ts
parseDuration(isoDurationStr: string): number // like '1.12:30:00'
```

### `parseIsoDuration`

```ts
parseIsoDuration(durationStr: string): number // like 'P1D'
```


## Formatting

Most of the time "formatting" means converting an object to a string, but in Dateless it also means converting a DateMaker into a different format.

### `formatTimestamp`

Convert a DateMarker into a UNIX timestamp.

```ts
formatTimestamp(marker: number): number
```

### `formatNative`

Convert a DateMarker into a native Date object.

```ts
formatNative(marker: number): Date
```

### `formatIso`

Format an ISO8601 string like `'2021-05-04T03:08:03-07:00'`

```ts
formatIso(marker: number, timeZone = 'local'): string
```

### `formatIsoMonth`

Format an ISO8601 string with only year and month, like `'2021-05'`

```ts
formatIsoMonth(marker: number): string
```

### `formatIsoDate`

Format an ISO8601 string with only year/month/date, like `'2021-05-04'`

```ts
formatIsoDate(marker: number): string
```

### `formatIsoDateTime`

Format an ISO8601 string WITHOUT the time zone part, like `'2021-05-04T03:08:03'`

```ts
formatIsoDate(marker: number): string
```

### `formatIntl`

Format a DateMarker using Intl flags. This is the preferred way to format a human-readable string for maximum internationalization.

```ts
formatIntl(marker: number, formatOptions: FormatIntlOptions): string
```

Accepts the same type of object that [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) accepts, in addition to more:

```ts
interface FormatIntlOptions {
  locale?: string | string[],
  omitZeroTime?: boolean,

  // standard DateTimeFormat options:
  timeZone?: string,
  calendar?,
  numberingSystem?,
  dateStyle?,
  timeStyle?,
  dayPeriod?,
  hour12?,
  hourCycle?,
  weekday?,
  era?,
  year?,
  month?,
  day?,
  hour?,
  minute?,
  second?,
  fractionalSecondDigits?,
  timeZoneName?,
}
```

### `formatStr`

Formats a date marker into a string using date-formatting tokens similar to MomentJS/Dayjs. More info: https://day.js.org/docs/en/display/format

```ts
formatStr(marker: number, format: string, options?: FormatStrOptions): string
```

The final optional option accepts:

```ts
interface FormatStrOptions {
  locale?: string | string[],
  timeZone?: string,

  // for customizing the locale
  months?: string[],
  monthsShort?: string[],
  monthsNarrow?: string[],
  weekdays?: string[],
  weekdaysShort?: string[],
  weekdaysNarrow?: string[],
}
```

### `formatRangeIntl`

For creating strings like `Jun 8 - 9, 2018`.

```ts
formatRangeIntl(marker0: number, marker1: number, options?: FormatRangeIntlOptions): string
```

The optional option accepts:

```ts
interface FormatRangeIntlOptions extends FormatIntlOptions {
  separator?: string // defaults ' - '
}
```

### `formatRangeStr`

For creating strings like `Jun 8 - 9, 2018`.

```ts
formatRangeStr(marker0: number, marker1: number, format: string, options?: FormatRangeStrOptions): string
```

The optional option accepts:

```ts
interface FormatRangeStrOptions extends FormatStrOptions {
  separator?: string // defaults ' - '
}
```

### `formatDurationIso`
### `formatDurationIntl`
### `formatDurationStr`
### `formatRelative`
### `formatRelativeDuration`
### `formatLocale`

## Getting

### `getYear`
### `getMonth`
### `getMonthDay`
### `getHours`
### `getMinutes`
### `getSeconds`
### `getMilliseconds`
### `getIsoWeek`
### `getIsoWeekday`
### `getWeek`
### `getWeekday`
### `getIsLeapYear`
### `getIsDst`
### `getTimeZoneOffset`
### `getTimeZoneOffsetForTimestamp`
### `getYearDays`
### `getMonthDays`
### `getWeekStart`

## Setting

### `setYear`
### `setMonth`
### `setMonthDay`
### `setHours`
### `setMinutes`
### `setSeconds`
### `setMilliseconds`
### `setIsoWeek`
### `setIsoWeekday`
### `setWeek`
### `setWeekday`

## Adding

### `addYears`
### `addMonths`
### `addWeeks`
### `addDays`
### `addHours`
### `addMinutes`
### `addSeconds`
### `addMilliseconds`
### `addDuration`
### `addDurations`

## Subtracting

### `subYears`
### `subMonths`
### `subDays`
### `subHours`
### `subMinutes`
### `subSeconds`
### `subMilliseconds`
### `subDuration`
### `subDurations`

## Multiplying

### `multDurations`

## Diffing

### `diffYears`
### `diffMonths`
### `diffDays`
### `diffHours`
### `diffMinutes`
### `diffSeconds`
### `diffMilliseconds`
### `diffUnits`

## Start-of

### `startOfYear`
### `startOfMonth`
### `startOfDay`
### `startOfHour`
### `startOfMinute`
### `startOfSecond`
### `startOfIsoWeek`
### `startOfWeek`
### `startOfUnit`

## As-unit

### `asYears`
### `asMonths`
### `asDays`
### `asHours`
### `asMinutes`
### `asSeconds`
### `asMilliseconds`

## Comparing

## Converting

## ESLint plugin
