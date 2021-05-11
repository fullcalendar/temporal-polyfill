
# Temporal

Lightweight [ponyfills](https://ponyfoo.com/articles/polyfills-or-ponyfills) for date-related ECMASCript proposals. Includes the following packages:


## temporal-lite

A lightweight subset of the [Temporal](https://tc39.es/proposal-temporal/docs/) spec, which provides a superior alternative to the `Date` object. Example code:

```js
import { PlainDateTime, TimeZone, Duration } from 'temporal-lite'

let pdt = PlainDateTime.from('2020-06-01T00:00:00')
let zdt0 = dt0.toZonedDateTime(new TimeZone('America/Chicago'))
let zdt1 = zdt0.add(Duration.from('P1D'))
console.log(zdt1.toString())
```

This package only implements the following objects from the spec:

- [Calendar](https://tc39.es/proposal-temporal/docs/calendar.html)
- [TimeZone](https://tc39.es/proposal-temporal/docs/timezone.html)
- [Duration](https://tc39.es/proposal-temporal/docs/duration.html)
- [PlainDateTime](https://tc39.es/proposal-temporal/docs/plaindatetime.html)
- [ZonedDateTime](https://tc39.es/proposal-temporal/docs/zoneddatetime.html)
- [now](https://tc39.es/proposal-temporal/docs/now.html) (as `Now`)

Notable departures from the original spec:

- There are no `PlainDate`, `PlainTime`, `PlainMonthDay`, nor `PlainYearMonth` classes. Only the `PlainDateTime` class is offered.
- Instead of an `Instant` class, we are using millisecond times, often called `epochMilliseconds`.
- The smallest time granularity is milliseconds. The API omits microseconds and nanosecods altogether.


## temporal-format

This package provides the following functionality, none of which requires external locale data:

- An improved version of the `Intl.DateTimeFormat` class
- A lightweight implementation of the [Intl.DurationFormat](https://github.com/tc39/proposal-intl-duration-format) spec
- A non-standard `TokenDateTimeFormat` class for formatting with token strings

The `DateTimeFormat` class accepts `PlainDateTime` and `ZonedDateTime` objects. Example code:

```js
import { DateTimeFormat } from 'temporal-format'
import { Now } from 'temporal-lite'

let f = new DateTimeFormat('fr', {
  /* accepts all Intl.DateTimeFormat options */
  rangeSeparator: ' to ' // optional. defaults to ' - '
})
f.format(dt)
f.formatRange(dt0, dt1)
```

The `timeZone` and `calendar` options passed into the constructor take precedence over the zone/calendar belonging to the given datetimes. Also, a `rangeSeparator` option is accepted, which is needed to provide `formatRange` functionality, functionality that currently has poor browser support. 

The `DurationFormat` class is an alternative to the `Intl.DurationFormat` class, which has poor browser support. Example code:

```js
import { DurationFormat } from 'temporal-format'
import { Duration } from 'temporal-lite'

let f = new DurationFormat('fr', {
  localeMatcher,
  numberingSystem,
  style: 'long', // long|short|narrow
  fields: ['day'] // optional. determines which fields are in the output
})
f.format(Duration.from('P1D')) // '1 day'
```

This is all possible via string-level hacks on the output of [RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat).

The `TokenDateTimeFormat` class allows formatting using [moment-compatible format strings](https://momentjs.com/docs/#/displaying/). Example code:

```js
let f = new TokenDateTimeFormat('MMMM D, YYYY', 'fr', {
  localeMatcher,
  numberingSystem,
  timeZone: 'America/Chicago', // optional override
  calendar: 'gregory', // optional override
  rangeSeparator: ' to ' // optional. defaults to ' - '
  /* other options:
  monthsLong: string[],
  monthsShort: string[],
  monthsNarrow: string[],
  weekdaysLong: string[],
  weekdaysShort: string[],
  weekdaysNarrow: string[],
  */
})
f.format(dt) // 'May 11, 2021'
f.formatRange(dt0, dt1) // 'May 11 to 12, 2021'
```

Just like `DateTimeFormat`, it accepts an options object with `timeZone` and `calendar`. These options take precedence over the zone/calendar belonging to the given datetimes.

No external locale data is needed because this class will internally leverage [Intl.DateTimeFormat::formatToParts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts). Overrides are allowed (`monthsLong`, `monthsShort`, etc).

The moment-compatible format strings allow for the locale-aware non-ISO versions of "Week of Year" and "Week Year". This information will be derived from the `locale-info` package, mentioned below.


## locale-info

[There is a proposal](https://github.com/tc39/proposal-intl-locale-info#high-level-design) to add extra properties to the `Intl.Locale` object:

- `textInfo` - information about ltr/rtl
- `weekInfo` - information about week-start and week-of-year

Instead of creating an API that emulates the `Intl.Locale` class, simple functions will be provided. Example code:

```js
import { getLocaleTextInfo } from 'locale-info'
console.log(getLocaleTextInfo('ar-LY'))
// { direction: 'rtl' }

import { getLocaleWeekInfo } from 'locale-info'
console.log(getLocaleWeekInfo('af'))
// { firstDay: 7, weekendStart: 6, weekendEnd: 7, minimalDays: 1 }

import { getLocaleWeekOfYear } from 'local-info'
console.log(getLocaleWeekOfYear('af', datetime))
// 33
```

The `getLocaleWeekOfYear` function will leverage `getLocaleWeekInfo`'s output and use an algorithm. The algorithm can be derived from [moment's source code](https://github.com/moment/moment/blob/develop/src/lib/units/week-calendar-utils.js#L39) in combination with the `dow` and `doy` properties that appear in the [locale data](https://github.com/moment/moment/blob/develop/src/locale/af.js#L67).

As previously mentioned, no external locale data is required. The information for all locales will be included the source code in a very compressed format.
