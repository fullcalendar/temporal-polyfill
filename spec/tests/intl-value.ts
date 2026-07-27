import { Intl as TemporalIntl } from 'temporal-spec'

const dateFormatter = new TemporalIntl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
})

dateFormatter.format(new Date())
