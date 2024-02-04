
# Intl.NumberFormat Browser Support Worksheet

## Final Results

### Full Support

Supports all duration units including `microsecond`/`nanoseconds`:

<table>
  <thead>
    <tr>
      <th>Chrome</th>
      <th>Firefox</th>
      <th>Opera</th>
      <th>Edge</th>
      <th>Safari</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>110<br />(Feb 2023)</td>
      <td>108<br />(Dec 2022)</td>
      <td>96<br />(Feb 2023)</td>
      <td>110<br />(Feb 2023)</td>
      <td>16.5<br />(May 2023)</td>
    </tr>
  </tbody>
</table>

### Partial Support

Supports unis `year`/`month`/`week`/`day`/`hour`/`minute`/`second`/`millisecond`:

<table>
  <thead>
    <tr>
      <th>Chrome</th>
      <th>Firefox</th>
      <th>Opera</th>
      <th>Edge</th>
      <th>Safari</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>77<br />(Sep 2019)</td>
      <td>78<br />(Jun 2020)</td>
      <td>64<br />(Oct 2019)</td>
      <td>79<br />(Jan 2020)</td>
      <td>14.1<br />(Apr 2021)</td>
    </tr>
  </tbody>
</table>

### If Leveraging `Intl.RelativeTimeFormat` Instead

<table>
  <thead>
    <tr>
      <th>Chrome</th>
      <th>Firefox</th>
      <th>Opera</th>
      <th>Edge</th>
      <th>Safari</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>71<br />(Dec 2018)</td>
      <td>65<br />(Jan 2019)</td>
      <td>58<br />(Jan 2019)</td>
      <td>79<br />(Jan 2020)</td>
      <td>14<br />(Sep 2020)</td>
    </tr>
  </tbody>
</table>


## Via LambdaTest Screenshot Testing

Marks the *first* browser version that supports:

Chrome (Windows 11)
- 110 - full support
- 77 - support w/o sub-milliseconds

Firefox (Windows 11)
- 108 - full support
- 78 - support w/o sub-milliseconds

Opera (Windows 11)
- 96 - full support
- 64 - support w/o sub-milliseconds

Edge (Windows 11)
- 110 - full support
- 79 - support w/o sub-milliseconds (lowest possible in LambdaTest)

Safari (MacOS)
- 16.6 (Ventura) - full support
- 14.1.1 (Big Sur) - support w/o sub-milliseconds

Safari (iOS) - *confusing version numbers*


## Via BrowserStack Live Testing

Grab bag of versions:

Safari (MacOS)
- 16.5 - yes
- 15.6 - yes, no sub-milliseconds
- 14.1 - yes, no sub-milliseconds
- 13.1 - no

Safari (iOS)
- 16.3 - yes, no sub-milliseconds
- 14.1 - yes, no sub-milliseconds
- 15.5 - yes, no sub-milliseconds
- 15.4 - yes, no sub-milliseconds
- 15.3 - yes, no sub-milliseconds
- 14.1.2 - yes, no sub-milliseconds
- 14.0.3 - no
- 14.0.1 - no
- 14.0 - no
- 13.1 - no
- 11.0 - no

## Resources

- [StackOverflow](https://stackoverflow.com/questions/60566942/why-doesnt-intl-numberformat-work-with-units-in-safari-and-firefox/60588156#60588156)
- [V8 Intl.NumberFormat](https://v8.dev/features/intl-numberformat)
- [Safari 14.1](https://developer.apple.com/documentation/safari-release-notes/safari-14_1-release-notes/)
