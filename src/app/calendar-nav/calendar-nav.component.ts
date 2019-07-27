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
    selector: 'dp-calendar-nav',
    templateUrl: './calendar-nav.component.html',
    styleUrls: ['./calendar-nav.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarNavComponent {
    @Input() labels: string[];
    @Input() rtl: boolean;
    @Input() currentMode: ECalendarMode;
    @Input() isLabelClickable: boolean = false;
    @Input() showLeftNav: boolean = true;
    @Input() showLeftSecondaryNav: boolean = false;
    @Input() showRightNav: boolean = true;
    @Input() showRightSecondaryNav: boolean = false;
    @Input() leftNavDisabled: boolean = false;
    @Input() leftSecondaryNavDisabled: boolean = false;
    @Input() rightNavDisabled: boolean = false;
    @Input() rightSecondaryNavDisabled: boolean = false;
    @HostBinding('class') @Input() theme: string;

    @Output() onLeftNav: EventEmitter<null> = new EventEmitter();
    @Output() onLeftSecondaryNav: EventEmitter<null> = new EventEmitter();
    @Output() onRightNav: EventEmitter<null> = new EventEmitter();
    @Output() onRightSecondaryNav: EventEmitter<null> = new EventEmitter();
    @Output() onLabelClick: EventEmitter<null> = new EventEmitter();

    leftNavClicked() {
        this[`on${this.rtl ? 'Right' : 'Left'}Nav`].emit();
    }

    rightNavClicked() {
        this[`on${this.rtl ? 'Left' : 'Right'}Nav`].emit();
    }

    leftSecondaryNavClicked() {
        this[`on${this.rtl ? 'Right' : 'Left'}SecondaryNav`].emit();
    }

    rightSecondaryNavClicked() {
        this[`on${this.rtl ? 'Left' : 'Right'}SecondaryNav`].emit();
    }

    labelClicked() {
        this.currentMode = this.currentMode === ECalendarMode.Month ? ECalendarMode.Day : ECalendarMode.Month;
        this.onLabelClick.emit();
    }
}
