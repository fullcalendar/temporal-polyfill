# Func API Notes

## Formatting Options

The func API does not expose an `Intl.DateTimeFormat`-like object that can own
formatter state between calls. To avoid repeatedly constructing expensive
`Intl.DateTimeFormat` instances, `toLocaleString`-style functions cache
formatters by the passed `options` object identity, plus locale and forced time
zone inputs.

Callers should treat reused formatting `options` objects as immutable. If an
options object is mutated and passed again, formatting may continue using the
formatter that was created for the object's earlier property values.
