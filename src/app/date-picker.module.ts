import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomHelper } from './common/services/dom-appender/dom-appender.service';
import { UtilsService } from './common/services/utils/utils.service';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { DayCalendarComponent } from './day-calendar/day-calendar.component';
import { MonthCalendarComponent } from './month-calendar/month-calendar.component';
import { TimeSelectComponent } from './time-select/time-select.component';
import { CalendarNavComponent } from './calendar-nav/calendar-nav.component';
import { CalendarFooterComponent } from './calendar-footer/calendar-footer.component';
export { DatePickerComponent } from './date-picker/date-picker.component';
export { DayCalendarComponent } from './day-calendar/day-calendar.component';
export { TimeSelectComponent } from './time-select/time-select.component';
export { MonthCalendarComponent } from './month-calendar/month-calendar.component';

@NgModule({
    providers: [
        DomHelper,
        UtilsService
    ],
    declarations: [
        DatePickerComponent,
        DayCalendarComponent,
        MonthCalendarComponent,
        CalendarNavComponent,
        CalendarFooterComponent,
        TimeSelectComponent
    ],
    entryComponents: [
        DatePickerComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        DatePickerComponent,
        MonthCalendarComponent,
        DayCalendarComponent,
        TimeSelectComponent
    ]
})
export class NgxJDatePickerModule {
}
