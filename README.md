
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
- [Optimizing](#optimizing)
- [ESLint Plugin](#eslint-plugin)

## Why?

Why does the world need another JavaScript date library? I was inspired by a series of bugs encountered while developing [FullCalendar](https://fullcalendar.io/). Imagine the following scenario: you need to print out each hour for the next 24 hours. You might write:

```js
// compute the start of the current hour
let date = new Date()
date.setMinutes(0)
date.setSeconds(0)
date.setMilliseconds(0)

// compute 24 hours later
let endDate = new Date(date.valueOf()) // clone date
endDate.setHours(date.getHours() + 24)

// increment by an hour in a loop
while (date.valueOf() < endDate.valueOf()) {
  console.log( // produce a string like '06:00'
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
(etc)
20:00
21:00
```

However, in certain time zones and in certain browsers, you would be surprised:

```
scenario 1     scenario 2     scenario 3
22:00          22:00          22:00
23:00          23:00          23:00
00:00          00:00          00:00
00:00 (!)      02:00 (!)      01:00
02:00          03:00          01:00
(etc)          (etc)          01:00
20:00          20:00          01:00
21:00          21:00          (infinite loop!)
```

This is due to the fact our program is running in whatever time zone the end-user is in. Each time zone has its own DST rules. DST rules cause certain hours of time to be omitted or double-added. Certain browsers handle these omissions and additions differently.

A time zone with no DST:

```
           2020                                         2021
------------+--------------------------------------------+----------
```

A time zone with DST:

```
           2020                                         2021
------------+-----------                      -----------+----------
                         ----------------------
                        ^                     ^
                   missing hour           extra hour
```

If you iterate over dates/times using the browser's local time zone, you are setting yourself up for unpredictability and disaster. It's like a train riding along tracks that have a random stretch of track uprooted and shifted a few feet.

![Image of a train wreck](https://westernnews.media.clients.ellingtoncms.com/img/photos/2018/06/06/Train_t670.JPG?b3f6a5d7692ccc373d56e40cf708e3fa67d9af9d)

What's the solution? Do date math in UTC instead, which is guaranteed not to have DST and which operates across all browsers consistently. Our modified example:

```js
// coerce current local date to UTC
let localDate = new Date()
let date = new Date(
  localDate.getYear(),
  localDate.getMonth(),
  localDate.getDate(),
  0, 0, 0, 0, // more info about this later
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
dayjs().utc().format()

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

Dateless takes a different approach. Its API completely sidesteps using time zones (and DST) during date manipulation.

## Getting Started

Install the lib:

```
npm install --save dateless
```

The following program prints each hour for the next 24 hours:

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

You might say it's similar to [date-fns](https://date-fns.org/) in its function-based approach, but instead of leveraging the built-in [Date object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) it leverages a date "marker", which is just an number. It's an integer that represent chronology in a zoneless UTC-like mode. Its bulletproof for date manipulation.

## Comparison with other libs

Aside from more robust date manipulation, Dateless has other advantages over other date libraries. Let's compare it to [Luxon](https://moment.github.io/luxon/index.html), [date-fns](https://date-fns.org/), and [Day.js](https://day.js.org/).

### 1) Other calendar systems

The 12-month "gregorian" calendar system that most of the world uses is not the only calendar system. There are others like "buddhist", "chinese", "coptic", and "ethiopia". Most date libraries allow you to string-format to another calendar system but none of them allow date manipulation. For example, you won't be able to print the first day in each month in the Jalali (aka Persion) calendar. You'll need to use a hard fork such as [jalaliday](https://github.com/alibaba-aero/jalaliday) (for Day.js) or [date-fns-jalali](https://github.com/date-fns-jalali/date-fns-jalali) (for date-fns).

### 2) No external locale files

Most libraries require you to import external files for formatting in locales other than `en-US`. 

### 3) Tree-shakeable

Date libraries either take a function-based approach, like date-fns, or an object-based approach, like Day.js and Luxon. A function-based approach allows your bundler to automatically remove unnused functions, resulting in smaller bundler sizes.

### 4) Ease of installation

Some libraries are easier to install and import than others. Date-fns is a bit awkward because there are multiple entrypoints you can import functions from (`date-fns`, `date-fns/addDays`, `date-fns/utc`, `date-fns/utc/addDays`, `date-fns/fp`, etc). Day.js can be clunky because each plugin is imported globally, and if you stop using a certain plugin's functionality, you must remember to unregister it.

### 5) Familiarity

If a library uses data types and function/property names that are already familiar to the developer because of their exposure to the built-in Date object and Intl API, then the library will be easier to learn.

### 6) Chainable

Many people prefer chainable APIs for doing things like:

```js
dayjs().startOf('day').add(1, 'hour).format()
```

### Results

Here's how the libraries stack up:

<table>
  <thead>
    <tr><th></th><th>Dateless</th><th>Luxon</th><th>date-fns</th><th>Day.js</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Zoneless date manipulation</td>
      <td>yes</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
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

Dateless is able to achieve its small footprint and simple API due to its reliance on the [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl). As a result, the following browers are NOT supported:

- IE (any version)
- Safari < 14 (though a small shim provides support)

Dateless uses a number of clever tricks to avoid needing a fully implemented Intl API.

## Types

### DateMarker

A "date marker" is simply a number:

```ts
type DateMarker = number
```

### Duration

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

### LooseDuration

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

### Locale

All locales are represented as simple strings:

```ts
type Locale = string // like 'en-US'
```

### TimeZone

All time zones are represented as [IANA strings](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). There are special cases for UTC and local time:

```ts
type TimeZone = 'local' | 'UTC' | string // like 'America/New_York'
```

### Calendar

A calendar system is a simple string. The same type of string [DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) accepts:

```ts
type Calendar = string // like 'buddhist' or 'chinese'
```

## Environmental defaults

Many of the functions Dateless provides accept `timeZone`, `locale`, and `calendar` paremeters. If these are not specified, certain defaults are used:

- `timeZone` - defaults to the browser's
- `locale` - defaults to browser's
- `calendar` - defaults to `'gregory'` for date manipulation, defaults to browser's for string-formatting

### `getDefaults`

Returns the current defaults that will be used across the API.

```ts
function getDefaults(): {
  timeZone: string,
  locale: string,
  calendar: string,
}
```

### `setDefaults`

Resets the the environmental defaults. All function calls that use these parameters will leverage the new defaults going forward.

```ts
function setDefaults(defaults: {
  timeZone?: string,
  locale?: string,
  calendar?: string,
}): void
```

This function is not recommended when creating distributable libraries.

### `setLocaleDefaults`

The [`formatStr`](#formatstr) and [`formatRangeStr`](#formatrangestr) functions can have their locale-specific month/weekday strings changed. This takes effect globally:

```ts
function setLocaleDefaults(locale: string, localeDefaults: {
  months?: string[],
  monthsShort?: string[],
  monthsNarrow?: string[],
  weekdays?: string[],
  weekdaysShort?: string[],
  weekdaysNarrow?: string[],
}): void
```

### `getAvailableLocales`

Returns an array of locale codes that have been verified to work well in all browsers. The browser might be capable of more. This is not an exhaustive list but rather an easy way to display a locale-chooser to the end-user.

```ts
function getAvailableLocales(): string[] // like ['en-US', 'es', 'fr',...]
```

This method returns locale codes like `'en-US'`. To display a locale name translated into an arbitrary language, use the [`formatLocale`](#formatlocale) method.


## Creating

### `createMarker`

Creates a new marker from literal year/month/day/hours/minutes/seconds/ms values.

```ts
function createMarker(input: CreateMarkerInput, calendar?: string): number
```

Accepts:

```ts
type CreateMarkerInput = {
  year?: number,
  month?: number,
  monthDay?: number,
  hours?: number,
  minutes?: number,
  seconds?: number,
  milliseconds?: number
} | [
  number?, // year
  number?, // month
  number?, // monthDay
  number?, // hours
  number?, // minutes
  number?, // seconds
  number?, // milliseconds
]
```

## Normalizing



### `normalizeDuration`

Given a [`LooseDuration`](#looseduration) object, returns a stricter [`Duration`](#duration) object with guaranteed properties.

```ts
function normalizeDuration(input: LooseDuration): Duration
```

### `normalizeLocale`

Given a list of potentially valid locale codes, returns the first recognized locale in a normalized form.

```ts
function normalizeLocale(locale: string | string[]): string
```

## Parsing

Most of the time "parsing" means deriving meaning from a string, but in Dateless it also means converting from a different format into a [DateMarker](#datemarker).

### `parseNow`

```ts
function parseNow(timeZone?: string): number
```

### `parseTimestamp`

```ts
function parseTimestamp(timestamp: number, timeZone?: string): number
```

### `parseNative`

```ts
function parseNative(dateObj: Date, timeZone?: string): number
```

### `parseIso`

```ts
function parseIso(isoDateStr: string, timeZone?: string): number // like '2021-05-01T12:00:00-07:00'
```

### `parseIsoDateTime`

```ts
function parseIsoDateTime(isoDateStr: string): number // like '2021-05-01T12:00:00' (no time zone offset)
```

### `parseDuration`

```ts
function parseDuration(isoDurationStr: string): number // like '1.12:30:00'
```

### `parseIsoDuration`

```ts
function parseIsoDuration(durationStr: string): number // like 'P1D'
```

## Formatting

Most of the time "formatting" means converting an object to a string, but in Dateless it also means converting a [DateMaker](#datemarker) into a different data type.

### `formatTimestamp`

Convert a DateMarker into a Unix timestamp.

```ts
function formatTimestamp(marker: number, timeZone?: string): number
```

### `formatNative`

Convert a DateMarker into a native Date object.

```ts
function formatNative(marker: number, timeZone?: string): Date
```

### `formatIso`

Format an ISO8601 string like `'2021-05-04T03:08:03-07:00'`

```ts
function formatIso(marker: number, timeZone?: string): string
```

If no `timeZone` is specified, the [default time zone](#environmental-defaults) will be used. To generate an ISO string without including the time zone, use [`formatIsoDateTime`](#formatisodatetime) instead.

### `formatIsoDateTime`

Format an ISO8601 string WITHOUT the time zone part, like `'2021-05-04T03:08:03'`

```ts
function formatIsoDate(marker: number): string
```

### `formatIsoDate`

Format an ISO8601 string with only year/month/date, like `'2021-05-04'`

```ts
function formatIsoDate(marker: number): string
```

### `formatIsoMonth`

Format an ISO8601 string with only year and month, like `'2021-05'`

```ts
function formatIsoMonth(marker: number): string
```

### `formatIntl`

Format a DateMarker using the Intl API. This is the preferred way to format a human-readable string for maximum internationalization.

```ts
function formatIntl(marker: number, options: FormatIntlOptions): string
```

Accepts the same options as [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) in addition to a few more:

```ts
interface FormatIntlOptions {
  timeZone?: string, // like 'America/New_York'
  timeZoneName?: 'long' | 'short', // how to display timeZone
  locale?: string | string[], // unlike Intl API, included within this object
  calendar?: string, // like 'gregory' or 'buddhist'
  numberingSystem?: string,
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
  omitZeroTime?: boolean, // removes strings like ':00'
  separator?: string, // for ranges. see formatRangeIntl
}
```

### `formatStr`

Formats a date marker into a string using date-formatting tokens. Uses the same tokens as MomentJS/Dayjs.

```ts
function formatStr(marker: number, tokens: string, options?: FormatStrOptions): string
```

Available tokens:

<table>
<thead>
<tr><th>Format</th><th>Output</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>YY</code></td><td>18</td><td>Two-digit year</td></tr>
<tr><td><code>YYYY</code></td><td>2018</td><td>Four-digit year</td></tr>
<tr><td><code>M</code></td><td>1-12</td><td>The month, beginning at 1</td></tr>
<tr><td><code>MM</code></td><td>01-12</td><td>The month, 2-digits</td></tr>
<tr><td><code>MMM</code></td><td>Jan-Dec</td><td>The abbreviated month name</td></tr>
<tr><td><code>MMMM</code></td><td>January-December</td><td>The full month name</td></tr>
<tr><td><code>D</code></td><td>1-31</td><td>The day of the month</td></tr>
<tr><td><code>DD</code></td><td>01-31</td><td>The day of the month, 2-digits</td></tr>
<tr><td><code>d</code></td><td>0-6</td><td>The day of the week, with Sunday as 0</td></tr>
<tr><td><code>dd</code></td><td>Su-Sa</td><td>The min name of the day of the week</td></tr>
<tr><td><code>ddd</code></td><td>Sun-Sat</td><td>The short name of the day of the week</td></tr>
<tr><td><code>dddd</code></td><td>Sunday-Saturday</td><td>The name of the day of the week</td></tr>
<tr><td><code>H</code></td><td>0-23</td><td>The hour</td></tr>
<tr><td><code>HH</code></td><td>00-23</td><td>The hour, 2-digits</td></tr>
<tr><td><code>h</code></td><td>1-12</td><td>The hour, 12-hour clock</td></tr>
<tr><td><code>hh</code></td><td>01-12</td><td>The hour, 12-hour clock, 2-digits</td></tr>
<tr><td><code>m</code></td><td>0-59</td><td>The minute</td></tr>
<tr><td><code>mm</code></td><td>00-59</td><td>The minute, 2-digits</td></tr>
<tr><td><code>s</code></td><td>0-59</td><td>The second</td></tr>
<tr><td><code>ss</code></td><td>00-59</td><td>The second, 2-digits</td></tr>
<tr><td><code>SSS</code></td><td>000-999</td><td>The millisecond, 3-digits</td></tr>
<tr><td><code>Z</code></td><td>+05:00</td><td>The offset from UTC, ±HH:mm</td></tr>
<tr><td><code>ZZ</code></td><td>+0500</td><td>The offset from UTC, ±HHmm</td></tr>
<tr><td><code>A</code></td><td>AM PM</td><td></td></tr>
<tr><td><code>a</code></td><td>am pm</td><td></td></tr>
</tbody>
</table>

To escape characters, wrap them in square brackets (e.g. `[MM]`).

Available options:

```ts
interface FormatStrOptions {
  timeZone?: string, // like 'America/New_York'
  locale?: string | string[], // one or more locale codes
  months?: string[], // like 'January'
  monthsShort?: string[], // like 'Jan'
  monthsNarrow?: string[], // like 'J'
  weekdays?: string[], // like 'Saturday'
  weekdaysShort?: string[], // like 'Sat'
  weekdaysNarrow?: string[], // like 'S'
  separator?: string, // for ranges. see formatRangeStr
}
```

### `formatRangeIntl`

For creating strings like `'Jun 8 - 9, 2021'` using the robust Intl API.

```ts
function formatRangeIntl(
  marker0: number,
  marker1: number,
  options?: FormatRangeIntlOptions,
): string
```

Accepts the same options as [formatIntl](#formatintl). Uses the `separator` property.

### `formatRangeStr`

For creating strings like `'Jun 8 - 9, 2021'` using a token string.

```ts
function formatRangeStr(
  marker0: number,
  marker1: number,
  tokens: string,
  options?: FormatRangeStrOptions,
): string
```

Accepts the same tokens as [formatStr](#formatstr).

Accepts the same options as [formatStr](#formatstr). Uses the `separator` property.

### `formatDurationIso`

Formats an [ISO duration](https://en.wikipedia.org/wiki/ISO_8601#Durations).
```ts
function formatDurationIso(duration: LooseDuration): string // like 'P1D'
```

### `formatDurationIntl`

```ts
function formatDurationIntl( // like '3 days'
  duration: LooseDuration,
  options: {
    locale?: string | string[],
    timeZone?: string,
  }
): string
```

### `formatDurationStr`

Uses a subset of the [`formatStr`](#formatstr) tokens. Can only display numeric values.

```ts
function formatDurationStr(duration: LooseDuration, tokens: string): string
```

### `formatRelative`

Formats a unit of time like `'1 day ago'` or `'yesterday'`. You must specify a number of units:

```ts
function formatRelative(
  num: number,
  unit: 'year' | 'month' | 'day' | 'hour' | 'second',
  options?: FormatRelativeOptions,
): string
```

Accepts a superset of the [RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat) options:

```ts
interface FormatRelativeOptions {
  locale?: string | string[],
  numeric?: 'always' | 'auto',
  style?: 'long' | 'short' | 'narrow',
}
```

### `formatRelativeDuration`

Just like `formatRelative` but accepts a duration. If the duration has multiple units (like months **and** days) it will display in the larger unit.

```ts
function formatRelativeDuration(
  duration: LooseDuration,
  options?: FormatRelativeDurationOptions
): string
```

Accepts a superset of the [RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat) options:

```ts
interface FormatRelativeDurationOptions {
  locale?: string | string[],
  numeric?: 'always' | 'auto',
  style?: 'long' | 'short' | 'narrow',
  alwaysRound?: boolean
}
```

### `formatLocale`

Displays a locale name translated into an arbitrary language.

```ts
function formatLocale(locale: string, displayInLocale: string): string
```

Examples:

```ts
formatLocale('en-US', 'es') // Inglés (Estados Unidos)
formatLocale('en-US', 'fr') // Anglais (États Unis)
```

NOTE: there are browser support implications for this.

## Getting

### `getYear`

Returns a 4-digit year.

```ts
function getYear(marker: number, calendar?: string): number
```

### `getMonth`

Returns a month number. For a gregorian calendar, this will be from `1` to `12`.

```ts
function getMonth(marker: number, calendar?: string): number
```

### `getMonthDay`

Returns the day-of-month. For a gregorian calendar, this will be from `1` to `31`.

```ts
function getMonthDay(marker: number, calendar?: string): number
```

### `getHours`

```ts
function getHours(marker: number): number
```

### `getMinutes`

```ts
function getMinutes(marker: number): number
```

### `getSeconds`

```ts
function getSeconds(marker: number): number
```

### `getMilliseconds`

```ts
function getMilliseconds(marker: number): number
```

### `getIsoWeek`

Returns the week number of the year, according to ISO standards.

```ts
function getIsoWeek(marker: number): number
```

### `getIsoWeekday`

Returns the day-of-week, with `0` signifying Monday.

```ts
function getIsoWeekday(marker: number): number
```

### `getWeek`

Returns the week number of the year, according to the locale.

```ts
function getWeek(marker: number, locale?: string): number
```

### `getWeekday`

Returns the day-of-week, with `0` signifying the first day of the week according to the locale.

```ts
function getWeekday(marker: number, locale?: string): number
```

### `getTimeZoneOffset`

Given a date marker, returns the UTC offset in the time zone. A UTC offset of `-01:00` would yield `-60`.

```ts
function getTimeZoneOffset(marker: number, timeZone?: string): number
```

### `getTimeZoneOffsetForTimestamp`

Given a Unix timestamp, returns the UTC offset in the time zone.

```ts
function getTimeZoneOffsetForTimestamp(timestamp: number, timeZone?: string): number
```

This function is a shortcut for:

```js
getTimeZoneOffset(parseTimestamp(timestamp, timeZone), timeZone)
```

### `getIsDst`

Whether the marker is in a period of Daylight Saving Time.

```ts
function getIsDst(marker: number, timeZone?: string): boolean
```

### `getIsDstGap`

```ts
function getIsDstGap(marker: number, timeZone?: string): boolean
```

### `getIsDstOverlap`

```ts
function getIsDstOverlap(marker: number, timeZone?: string): boolean
```

### `getIsLeapYear`

Whether the year is a leap year (assumed to be Gregorian calendar).

```ts
function getIsLeapYear(year: number): boolean
```

This function accepts a `year` value. For a marker, do:

```js
getIsLeapYear(getYear(marker))
```

### `getYearDays`

Returns the number of days in a year.

```ts
function getYearDays(year: number, calendar?: string): number
```

### `getMonthDays`

Returns the number of days in a month.

```ts
function getMonthDays(year: number, month: number, calendar?: string): number
```

This function accepts `year` and `month` values. For a marker, do:

```js
getMonthDays(getYear(marker), getMonth(marker))
```

### `getWeekStart`

Returns the day-of-week each week starts on according to a the locale. `0` always signifies Monday.

```ts
function getWeekStart(locale?: string): number
```

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

### `multDuration`

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

Date markers are just integers. Compare them use the numeric comparison operators `===`, `!==`, `<`, `>`, `<=`, `>=`

## Converting

Date makers can be converted to/from other formats using functions that have previously been discussed:

- [parseNative](#parsenative)
- [parseTimestamp](#parsetimestamp)
- [formatNative](#formatnative)
- [formatTimestamp](#formattimestamp)

## Optimizing

TODO
(use same options object for formatting)
(added benefit: good for memo)

## ESLint plugin

Many applications allow the end-user to select their time zone and locale. Some applications might even allow the user to select their calendar system. If so, when working with Dateless functions that accept `timeZone`/`locale`/`calendar` paremeters, you must always specify these. There is no way to elegantly enforce this during TypeScript compilation nor at runtime, so Dateless offers an ESLint plugin to help you.
