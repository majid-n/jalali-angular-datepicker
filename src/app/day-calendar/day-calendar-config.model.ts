import { ICalendar, ICalendarInternal } from '../common/models/calendar.model';
import { WeekDays, ECalendarValue } from '../common/models/calendar.model';
import { Moment } from 'jalali-moment';

export interface IConfig {
    isDayDisabledCallback?: (date: Moment) => boolean;
    isMonthDisabledCallback?: (date: Moment) => boolean;
    weekDayFormat?: string;
    weekDayFormatter?: (dayIndex: number) => string;
    showNearMonthDays?: boolean;
    showWeekNumbers?: boolean;
    firstDayOfWeek?: WeekDays;
    format?: string;
    allowMultiSelect?: boolean;
    monthFormat?: string;
    monthFormatter?: (month: Moment) => string;
    enableMonthSelector?: boolean;
    yearFormat?: string;
    yearFormatter?: (year: Moment) => string;
    dayBtnFormat?: string;
    dayBtnFormatter?: (day: Moment) => string;
    dayBtnCssClassCallback?: (day: Moment) => string;
    monthBtnFormat?: string;
    monthBtnFormatter?: (day: Moment) => string;
    monthBtnCssClassCallback?: (day: Moment) => string;
    multipleYearsNavigateBy?: number;
    showMultipleYearsNavigation?: 'all' | 'none' | 'month' | 'day';
    returnedValueType?: ECalendarValue;
    showGoToCurrent?: boolean;
    showSwitchLocale?: boolean;
    showTimeView?: boolean;
    unSelectOnClick?: boolean;
}

export interface IDayCalendarConfig extends IConfig,
    ICalendar {
}

export interface IDayCalendarConfigInternal extends IConfig,
    ICalendarInternal {
}
