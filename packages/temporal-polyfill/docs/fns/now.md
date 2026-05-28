# Now Functional API

Public functions exported for `Now`.

Examples assume the functional API is imported as:

```ts
import * as NowFns from 'temporal-polyfill/fns/now'
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

Fn API:

```ts
const timeZoneId = NowFns.timeZoneId()
```

Temporal API:

```ts
const timeZoneId = Temporal.Now.timeZoneId()
```

### `instant`

Signature:

```ts
() => InstantRecord
```

Fn API:

```ts
const instant = NowFns.instant()
```

Temporal API:

```ts
const instant = Temporal.Now.instant()
```

### `zonedDateTimeISO`

Signature:

```ts
(timeZoneId?: string) => ZonedDateTimeRecord
```

Fn API:

```ts
const zonedDateTime = NowFns.zonedDateTimeISO('America/New_York')
```

Temporal API:

```ts
const zonedDateTime = Temporal.Now.zonedDateTimeISO('America/New_York')
```

### `plainDateTimeISO`

Signature:

```ts
(timeZoneId?: string) => PlainDateTimeRecord
```

Fn API:

```ts
const dateTime = NowFns.plainDateTimeISO('America/New_York')
```

Temporal API:

```ts
const dateTime = Temporal.Now.plainDateTimeISO('America/New_York')
```

### `plainDateISO`

Signature:

```ts
(timeZoneId?: string) => PlainDateRecord
```

Fn API:

```ts
const date = NowFns.plainDateISO('America/New_York')
```

Temporal API:

```ts
const date = Temporal.Now.plainDateISO('America/New_York')
```

### `plainTimeISO`

Signature:

```ts
(timeZoneId?: string) => PlainTimeRecord
```

Fn API:

```ts
const time = NowFns.plainTimeISO('America/New_York')
```

Temporal API:

```ts
const time = Temporal.Now.plainTimeISO('America/New_York')
```
