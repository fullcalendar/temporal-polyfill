# Now Functional API

Public functions exported for `Now`.

## Functions

| Function | Abbreviated signature |
| --- | --- |
| `timeZoneId` | `() => string` |
| `instant` | `() => InstantRecord` |
| `zonedDateTimeISO` | `(timeZoneId?: string) => ZonedDateTimeRecord` |
| `plainDateTimeISO` | `(timeZoneId?: string) => PlainDateTimeRecord` |
| `plainDateISO` | `(timeZoneId?: string) => PlainDateRecord` |
| `plainTimeISO` | `(timeZoneId?: string) => PlainTimeRecord` |

The ISO functions use the system time zone when `timeZoneId` is omitted.

```ts
import * as NowFns from 'temporal-polyfill/fns/now'

const timeZoneId = NowFns.timeZoneId()
const instant = NowFns.instant()
const dateTime = NowFns.plainDateTimeISO('America/New_York')
```
