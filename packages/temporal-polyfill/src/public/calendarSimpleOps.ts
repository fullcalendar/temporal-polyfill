import { PlainDateBranding } from '../genericApi/branding'
import { dateRefiners } from '../genericApi/refiners'
import { IsoDateFields, isoTimeFieldDefaults } from '../internal/calendarIsoFields'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { Callable, mapProps } from '../internal/utils'
import { CalendarProtocol } from './calendarProtocol'
import { CalendarSlot } from './calendarSlot'
import { createPlainDate } from './plainDate'

interface AdapterSimpleState {
  calendarProtocol: CalendarProtocol
}

type AdapterSimpleOps = {
  [K in keyof typeof dateRefiners]: (isoFields: IsoDateFields) => any
}

const adapterSimpleOps = mapProps(
  (refiner, methodName) => {
    return function (this: AdapterSimpleState, isoFields: IsoDateFields) {
      const { calendarProtocol } = this
      return refiner(
        (calendarProtocol as any)[methodName](
          createPlainDate({
            ...isoFields,
            ...isoTimeFieldDefaults, // yuck
            calendar: calendarProtocol,
            branding: PlainDateBranding,
          })
        )
      )
    }
  },
  dateRefiners as Record<string, Callable>
) as AdapterSimpleOps

function createAdapterSimpleOps(
  calendarProtocol: CalendarProtocol
): AdapterSimpleOps {
  return Object.assign(
    Object.create(adapterSimpleOps),
    { calendarProtocol } as AdapterSimpleState
  )
}

export function createSimpleOps(calendarSlot: CalendarSlot): AdapterSimpleOps {
  if (typeof calendarSlot === 'string') {
    return createNativeStandardOps(calendarSlot) // has everything
  }
  return createAdapterSimpleOps(calendarSlot)
}
