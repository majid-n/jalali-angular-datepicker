import { Moment } from 'jalali-moment';
import { ICalendar, ICalendarInternal, ECalendarMode } from '../common/models/calendar.model';
import { ECalendarValue } from '../common/models/calendar.model';

export interface IConfig {
    isMonthDisabledCallback?: (date: Moment) => boolean;
    allowMultiSelect?: boolean;
    yearFormat?: string;
    yearFormatter?: (month: Moment) => string;
    format?: string;
    isNavHeaderBtnClickable?: boolean;
    monthBtnFormat?: string;
    monthBtnFormatter?: (day: Moment) => string;
    monthBtnCssClassCallback?: (day: Moment) => string;
    multipleYearsNavigateBy?: number;
    showMultipleYearsNavigation?: 'all' | 'none' | ECalendarMode;
    locale?: string;
    returnedValueType?: ECalendarValue;
    showGoToCurrent?: boolean;
    unSelectOnClick?: boolean;
}

export interface IMonthCalendarConfig extends IConfig,
    ICalendar {

}

export interface IMonthCalendarConfigInternal extends IConfig,
    ICalendarInternal {
}
