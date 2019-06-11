import debounce from '../../common/decorators/decorators';
import { IDatePickerConfig } from '../../date-picker/date-picker-config.model';
import { DatePickerComponent } from '../../date-picker/date-picker.component';
import { ECalendarValue, INavEvent } from '../../common/models/calendar.model';
import { Component, HostListener, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as momentNs from 'jalali-moment';
import { Moment } from 'jalali-moment';
const moment = momentNs;

const GLOBAL_OPTION_KEYS = [
    'theme',
    'locale',
    'returnedValueType',
    'displayDate'
];
const PICKER_OPTION_KEYS = [
    'apiclose',
    'apiopen',
    'appendTo',
    'disabled',
    'disableKeypress',
    'drops',
    'format',
    'openOnFocus',
    'openOnClick',
    'onOpenDelay',
    'opens',
    'placeholder',
    'required',
    'hideInputContainer',
    'hideOnOutsideClick'
];
const DAY_PICKER_DIRECTIVE_OPTION_KEYS = [
    'allowMultiSelect',
    'closeOnSelect',
    'closeOnSelectDelay',
    'showGoToCurrent',
    'moveCalendarTo',
    ...PICKER_OPTION_KEYS
];
const DAY_PICKER_OPTION_KEYS = [
    ...DAY_PICKER_DIRECTIVE_OPTION_KEYS
];
const MONTH_CALENDAR_OPTION_KEYS = [
    'minValidation',
    'maxValidation',
    'required',
    'max',
    'min',
    'monthBtnFormat',
    'multipleYearsNavigateBy',
    'showMultipleYearsNavigation',
    'yearFormat',
    'showGoToCurrent',
    'unSelectOnClick',
    'moveCalendarTo',
    ...GLOBAL_OPTION_KEYS
];
const DAY_CALENDAR_OPTION_KEYS = [
    'firstDayOfWeek',
    'max',
    'maxValidation',
    'min',
    'minValidation',
    'monthFormat',
    'weekdayNames',
    'showNearMonthDays',
    'showWeekNumbers',
    'enableMonthSelector',
    'dayBtnFormat',
    'weekdayFormat',
    'showGoToCurrent',
    'showSwitchLocale',
    'showTimeView',
    'unSelectOnClick',
    'moveCalendarTo',
    ...MONTH_CALENDAR_OPTION_KEYS
];

@Component({
    selector: 'dp-demo',
    templateUrl: './demo.component.html',
    entryComponents: [DatePickerComponent],
    styleUrls: ['./demo.component.less']
})
export class DemoComponent {
    showDemo: boolean = true;
    @ViewChild('dateComponent', {static: false}) dateComponent: DatePickerComponent;
    demoFormat = 'DD-MM-YYYY';
    readonly DAYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    readonly LANGS = [
        'en', 'af', 'ar-dz', 'ar-kw', 'ar-ly',
        'ar-ma', 'ar-sa', 'ar-tn', 'ar', 'az', 'be', 'bg', 'bn', 'bo',
        'br', 'bs', 'ca', 'cs', 'cv', 'cy', 'da', 'de-at', 'de-ch',
        'de', 'dv', 'el', 'en-au', 'en-ca', 'en-gb', 'en-ie', 'en-nz',
        'eo', 'es-do', 'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr-ca',
        'fr-ch', 'fr', 'fy', 'gd', 'gl', 'gom-latn', 'he', 'hi', 'hr',
        'hu', 'hy-am', 'id', 'is', 'it', 'ja', 'jv', 'ka', 'kk', 'km', 'kn',
        'ko', 'ky', 'lb', 'lo', 'lt', 'lv', 'me', 'mi', 'mk', 'ml', 'mr', 'ms-my',
        'ms', 'my', 'nb', 'ne', 'nl-be', 'nl', 'nn', 'pa-in', 'pl', 'pt-br',
        'pt', 'ro', 'ru', 'sd', 'se', 'si', 'sk', 'sl', 'sq', 'sr-cyrl', 'sr',
        'ss', 'sv', 'sw', 'ta', 'te', 'tet', 'th', 'tl-ph', 'tlh', 'tr', 'tzl',
        'tzm-latn', 'tzm', 'uk', 'ur', 'uz-latn', 'uz', 'vi', 'x-pseudo', 'yo', 'zh-cn', 'zh-hk', 'zh-tw'
    ];
    pickerMode = 'dayPicker';

    direction: string = 'ltr';
    date: Moment;
    dates: Moment[] = [];
    material: boolean = true;
    required: boolean = false;
    disabled: boolean = false;
    validationMinDate: Moment;
    validationMaxDate: Moment;
    validationMinTime: Moment;
    validationMaxTime: Moment;
    placeholder: string = 'Choose a date...';
    displayDate: Moment | string;
    dateTypes: { name: string, value: ECalendarValue }[] = [
        {
            name: 'Guess',
            value: null
        },
        {
            name: ECalendarValue[ECalendarValue.Moment],
            value: ECalendarValue.Moment
        },
        {
            name: ECalendarValue[ECalendarValue.MomentArr],
            value: ECalendarValue.MomentArr
        },
        {
            name: ECalendarValue[ECalendarValue.String],
            value: ECalendarValue.String
        },
        {
            name: ECalendarValue[ECalendarValue.StringArr],
            value: ECalendarValue.StringArr
        }
    ];

    formGroup: FormGroup = new FormGroup({
        datePicker: new FormControl({ value: this.date, disabled: this.disabled }, [
            this.required ? Validators.required : () => undefined,
            control => this.validationMinDate && this.config &&
                moment(control.value, this.config.format || 'DD/MM/YYYY HH:mm')
                    .isBefore(this.validationMinDate)
                ? { minDate: 'minDate Invalid' } : undefined,
            control => this.validationMaxDate && this.config &&
                moment(control.value, this.config.format || 'DD/MM/YYYY HH:mm')
                    .isAfter(this.validationMaxDate)
                ? { maxDate: 'maxDate Invalid' } : undefined
        ])
    });

    jalaliConfigExtension: IDatePickerConfig = {
        firstDayOfWeek: 'sa',
        monthFormat: 'MMMM YYYY',
        weekDayFormat: 'dd',
        dayBtnFormat: 'D',
        monthBtnFormat: 'MMM',
        format: 'YYYY/MM/DD HH:mm:ss',
        locale: 'fa'
    };
    gregorianSystemDefaults: IDatePickerConfig = {
        firstDayOfWeek: 'su',
        monthFormat: 'MMM, YYYY',
        disableKeypress: false,
        allowMultiSelect: false,
        closeOnSelect: undefined,
        closeOnSelectDelay: 100,
        openOnFocus: true,
        openOnClick: true,
        onOpenDelay: 0,
        weekDayFormat: 'ddd',
        appendTo: document.body,
        showNearMonthDays: true,
        showWeekNumbers: false,
        enableMonthSelector: true,
        yearFormat: 'YYYY',
        showGoToCurrent: true,
        showSwitchLocale: true,
        showTimeView: true,
        dayBtnFormat: 'DD',
        monthBtnFormat: 'MMM',
        hours12Format: 'hh',
        hours24Format: 'HH',
        meridiemFormat: 'A',
        minutesFormat: 'mm',
        minutesInterval: 1,
        secondsFormat: 'ss',
        secondsInterval: 1,
        showSeconds: true,
        showTwentyFourHours: true,
        timeSeparator: ':',
        multipleYearsNavigateBy: 10,
        showMultipleYearsNavigation: 'month',
        locale: 'en',
        hideInputContainer: false,
        returnedValueType: ECalendarValue.String,
        unSelectOnClick: true,
        hideOnOutsideClick: true
    };
    config: IDatePickerConfig = { ...this.gregorianSystemDefaults, ...this.jalaliConfigExtension };
    isAtTop: boolean = true;

    constructor() {
    }

    @HostListener('document:scroll')
    @debounce(100)
    updateIsAtTop() {
        this.isAtTop = document.body.scrollTop === 0;
    }

    // changeCalendarSystem() {
    //   const defaultCalSys = (this.config.locale === 'fa') ?
    //     {...this.gregorianSystemDefaults, ...this.jalaliConfigExtension} : this.gregorianSystemDefaults;
    //   this.date = moment();
    //   this.config = {...this.config, ...defaultCalSys};
    // }
    modeChanged(mode) {
        this.pickerMode = mode;
        this.config.hideInputContainer = false;
        this.config.inputElementContainer = undefined;
        this.formGroup.get('datePicker').setValue(this.date);
    }

    validatorsChanged() {
        this.formGroup.get('datePicker').updateValueAndValidity();
    }

    refreshDemo() {
        this.showDemo = false;
        setTimeout(() => {
            this.showDemo = true;
        });
    }

    configChanged(change: string = 'N/A', value: any = 'N/A') {
        this.config = { ...this.config };

        if (change === 'locale') {
            // const defaultCalSys = (this.config.locale === 'fa') ?
            //   {...this.gregorianSystemDefaults, ...this.jalaliConfigExtension} : this.gregorianSystemDefaults;
            // this.datePicker.changeLocale(this.config.locale);
            // this.date = moment();
            // this.config = {...this.config, ...defaultCalSys};
            this.refreshDemo();
        }
    };

    openCalendar() {
        if (this.dateComponent) {
            this.dateComponent.api.open();
        }
    }

    closeCalendar() {
        if (this.dateComponent) {
            this.dateComponent.api.close();
        }
    }

    opened() {
        console.log('opened');
    }

    closed() {
        console.log('closed');
    }

    isValidConfig(key: string): boolean {
        switch (this.pickerMode) {
            case 'dayPicker':
                return [
                    ...DAY_PICKER_OPTION_KEYS,
                    ...DAY_CALENDAR_OPTION_KEYS
                ].indexOf(key) > -1;
            default:
                return true;
        }
    }

    private getDefaultFormatByMode(mode: string): string {
        switch (mode) {
            case 'dayPicker':
                return 'DD/MM/YYYY HH:mm';
        }
    }

    log(item) {
        console.log(item);
    }

    onLeftNav(change: INavEvent) {
        console.log('left nav', change);
    }

    onRightNav(change: INavEvent) {
        console.log('right nav', change);
    }

    moveCalendarTo() {
        this.dateComponent.api.moveCalendarTo(moment('14-01-1987', this.demoFormat));
    }
}
