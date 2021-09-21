
# Temporal

A lightweight spec-compliant [Temporal](https://github.com/tc39/proposal-temporal) polyfill in addition to other jsnext date utilities.

## Installation

Before building anything:

```sh
git submodule update --init
```

(don't do recursive)

## Commands

```
yarn build
yarn watch
yarn test --watch
yarn test --coverage
yarn lint
```

## TODO

- since `build` command doesn't generate .d.ts files anymore, have a one-time watch script (dev?)
  - how to pass/redirect arguments to yarn scripts. could give --watch to build then
- compile cjs (based off min version? or nor, we want it to be readable since no sourcemaps)
- will need to specify a minumum node version, since newer syntax
- entry points in package.json
- make unit-types more straightforward
- convert all script/(lib) to cjs
- exclude submodules dirs from searches in vscode
- add ruler in vscode settings
