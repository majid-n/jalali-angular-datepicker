import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    Output,
    ViewEncapsulation
} from '@angular/core';
import { ECalendarMode } from '../common/models/calendar.model';

@Component({
    selector: 'dp-calendar-footer',
    templateUrl: './calendar-footer.component.html',
    styleUrls: ['./calendar-footer.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarFooterComponent {
    @Input() showGoToCurrent: boolean = true;
    @Input() showSwitchLocale: boolean = true;
    @Input() showTimeView: boolean = true;
    @Input() currentMode: ECalendarMode;
    @Input() currentLocale: string;

    @HostBinding('class') @Input() theme: string;

    @Output() onGoToCurrent: EventEmitter<null> = new EventEmitter();
    @Output() onSwitchLocale: EventEmitter<null> = new EventEmitter();
    @Output() onTimeView: EventEmitter<null> = new EventEmitter();

    CalendarMode = ECalendarMode;

    GoToCurrent() {
        this.onGoToCurrent.emit();
    }

    SwitchLocale() {
        this.onSwitchLocale.emit();
    }

    TimeView() {
        this.onTimeView.emit();
    }
}
