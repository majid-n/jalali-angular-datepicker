import { SingleCalendarValue } from '../common/models/calendar.model';

export interface IDpDayPickerApi {
    open: () => void;
    close: () => void;
    moveCalendarTo: (date: SingleCalendarValue) => void;
}
