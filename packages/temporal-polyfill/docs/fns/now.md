# Now Tree-shakeable API

Public functions exported for `Now`.

Examples assume the tree-shakeable API is imported as:

```ts
import * as NowFns from 'temporal-polyfill/fns/Now'
```

## Contents

- [Current Time](#current-time)
  - [`timeZoneId`](#timezoneid)
  - [`instant`](#instant)
  - [`zonedDateTimeISO`](#zoneddatetimeiso)
  - [`plainDateTimeISO`](#plaindatetimeiso)
  - [`plainDateISO`](#plaindateiso)
  - [`plainTimeISO`](#plaintimeiso)

## Current Time

The ISO functions use the system time zone when `timeZoneId` is omitted.

### `timeZoneId`

Signature:

```ts
() => string
```

Tree-shakeable API:

```ts
const timeZoneId = NowFns.timeZoneId()
```

Temporal API equivalent:

```ts
const timeZoneId = Temporal.Now.timeZoneId()
```

### `instant`

Signature:

```ts
() => InstantFns.Record
```

Tree-shakeable API:

```ts
const instant = NowFns.instant()
```

Temporal API equivalent:

```ts
const instant = Temporal.Now.instant()
```

### `zonedDateTimeISO`

Signature:

```ts
(timeZoneId?: string) => ZonedDateTimeFns.Record
```

Tree-shakeable API:

```ts
const zonedDateTime = NowFns.zonedDateTimeISO('America/New_York')
```

Temporal API equivalent:

```ts
const zonedDateTime = Temporal.Now.zonedDateTimeISO('America/New_York')
```

### `plainDateTimeISO`

Signature:

```ts
(timeZoneId?: string) => PlainDateTimeFns.Record
```

Tree-shakeable API:

```ts
const dateTime = NowFns.plainDateTimeISO('America/New_York')
```

Temporal API equivalent:

```ts
const dateTime = Temporal.Now.plainDateTimeISO('America/New_York')
```

### `plainDateISO`

Signature:

```ts
(timeZoneId?: string) => PlainDateFns.Record
```

Tree-shakeable API:

```ts
const date = NowFns.plainDateISO('America/New_York')
```

Temporal API equivalent:

```ts
const date = Temporal.Now.plainDateISO('America/New_York')
```

### `plainTimeISO`

Signature:

```ts
(timeZoneId?: string) => PlainTimeFns.Record
```

Tree-shakeable API:

```ts
const time = NowFns.plainTimeISO('America/New_York')
```

Temporal API equivalent:

```ts
const time = Temporal.Now.plainTimeISO('America/New_York')
```
