
How to manually update tests

```
git clone https://github.com/tc39/proposal-temporal.git
cd proposal-temporal/polyfill/test
git diff f0bc1c5a086e954e29fe1ccce0fc33383b4eb4d2 -- *.js *.mjs
```

TODO: write tests for Date::toTemporalInstant
https://tc39.es/proposal-temporal/docs/cookbook.html#instant-from-legacy-date
