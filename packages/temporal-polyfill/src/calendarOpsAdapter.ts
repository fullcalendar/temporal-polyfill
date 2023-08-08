import { CalendarProtocol } from './calendar';
import { DateBag, DateBagStrict, DateGetterFields, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict, dateGetterRefiners } from './calendarFields';
import {
  createWrapperClass, getStrictInternals,
  idGettersStrict, WrapperInstance
} from './class';
import { Duration, createDuration } from './duration';
import { DurationInternals } from './durationFields';
import { IsoDateFields } from './isoFields';
import { IsoDateInternals } from './isoInternals';
import { Overflow, overflowMapNames } from './options';
import { ensureObjectlike, ensureString } from './cast';
import { PlainDate, createPlainDate } from './plainDate';
import { PlainMonthDay } from './plainMonthDay';
import { PlainYearMonth } from './plainYearMonth';
import { Unit, unitNamesAsc } from './units';
import { BoundArg, Callable, mapProps } from './utils';

const getPlainDateInternals = getStrictInternals.bind<
  undefined, [BoundArg],
  [PlainDate],
  IsoDateInternals // return
>(undefined, PlainDate);

const getPlainYearMonthInternals = getStrictInternals.bind<
  undefined, [BoundArg],
  [PlainYearMonth],
  IsoDateInternals // return
>(undefined, PlainYearMonth);

const getPlainMonthDayInternals = getStrictInternals.bind<
  undefined, [BoundArg],
  [PlainMonthDay],
  IsoDateInternals // return
>(undefined, PlainMonthDay);

const getDurationInternals = getStrictInternals.bind<
  undefined, [BoundArg],
  [Duration],
  DurationInternals // return
>(undefined, Duration);

const calendarOpsAdapterMethods = {
  ...mapProps((refiner: Callable, propName) => {
    return ((calendar: CalendarProtocol, isoDateFields: IsoDateFields) => {
      // HACK: hopefully `calendar` not accessed
      const pd = createPlainDate(isoDateFields as IsoDateInternals);
      return refiner(calendar[propName](pd));
    });
  }, dateGetterRefiners) as {
    [K in keyof DateGetterFields]: (calendar: CalendarProtocol, isoFields: IsoDateFields) => DateGetterFields[K];
  },

  dateAdd(
    calendar: CalendarProtocol,
    isoDateFields: IsoDateInternals,
    durationInternals: DurationInternals,
    overflow: Overflow
  ): IsoDateInternals {
    return getPlainDateInternals(
      calendar.dateAdd(
        createPlainDate(isoDateFields),
        createDuration(durationInternals),
        { overflow: overflowMapNames[overflow] }
      )
    );
  },

  dateUntil(
    calendar: CalendarProtocol,
    isoDateFields0: IsoDateFields,
    isoDateFields1: IsoDateFields,
    largestUnit: Unit
  ): DurationInternals {
    return getDurationInternals(
      calendar.dateUntil(
        createPlainDate(isoDateFields0 as IsoDateInternals),
        createPlainDate(isoDateFields1 as IsoDateInternals),
        { largestUnit: unitNamesAsc[largestUnit] }
      )
    );
  },

  dateFromFields(
    calendar: CalendarProtocol,
    fields: DateBag,
    overflow: Overflow
  ): IsoDateInternals {
    return getPlainDateInternals(
      calendar.dateFromFields(
        fields as DateBagStrict,
        { overflow: overflowMapNames[overflow] }
      )
    );
  },

  yearMonthFromFields(
    calendar: CalendarProtocol,
    fields: YearMonthBag,
    overflow: Overflow
  ): IsoDateInternals {
    return getPlainYearMonthInternals(
      calendar.yearMonthFromFields(
        fields as YearMonthBagStrict,
        { overflow: overflowMapNames[overflow] }
      )
    );
  },

  monthDayFromFields(
    calendar: CalendarProtocol,
    fields: MonthDayBag,
    overflow: Overflow
  ): IsoDateInternals {
    return getPlainMonthDayInternals(
      calendar.monthDayFromFields(
        fields as MonthDayBagStrict,
        { overflow: overflowMapNames[overflow] }
      )
    );
  },

  fields(calendar: CalendarProtocol, fieldNames: string[]): string[] {
    return [...calendar.fields(fieldNames)].map(ensureString);
    // TODO: kill ensureArray elsewhere?
  },

  mergeFields(
    calendar: CalendarProtocol,
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    return ensureObjectlike(calendar.mergeFields(fields0, fields1));
  },
};

export type CalendarOpsAdapter = WrapperInstance<
  CalendarProtocol, // internals
  typeof idGettersStrict, // getters
  typeof calendarOpsAdapterMethods // methods
>;

export const CalendarOpsAdapter = createWrapperClass<
  [CalendarProtocol],
  CalendarProtocol,
  typeof idGettersStrict,
  typeof calendarOpsAdapterMethods // methods
>(idGettersStrict, calendarOpsAdapterMethods);
