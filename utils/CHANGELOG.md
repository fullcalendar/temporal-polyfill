
# `temporal-utils` Changelog

## Unreleased

- FIX: `startOfMonth`, `startOfYear` and the rounding built on them pick the first occurrence of a repeated midnight
- FIX: `endOfDay` and longer ends no longer run an hour into the next day when the day doesn't start at midnight
- FIX: `endOfYear`, `endOfMonth`, `endOfWeek` and `endOfDay`, and `endOfHour` and shorter on plain types, work when the period's start is out of range

## v1.0.3

- FIX: `diff*` helpers honor `roundingIncrement` when `roundingMode` is omitted, using Temporal's default `trunc` rounding
- FIX: Date-unit `diff*` helpers return `0` for equal inputs at range boundaries instead of throwing

## v1.0.2

- FIX: Compatibility with CJS and `require(esm)` (#101), thx @connor-baer

## v1.0.1

- FEATURE: Initial release. [See docs](./README.md) or [how it ties into other packages](../README.md).
- VERSION-NOTE: This first real 1.0 release is released as 1.0.1 because 1.0.0 was accidentally published as a blank package many years ago
