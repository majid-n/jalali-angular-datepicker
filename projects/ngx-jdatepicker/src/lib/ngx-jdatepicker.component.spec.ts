import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxJdatepickerComponent } from './ngx-jdatepicker.component';

describe('NgxJdatepickerComponent', () => {
  let component: NgxJdatepickerComponent;
  let fixture: ComponentFixture<NgxJdatepickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgxJdatepickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxJdatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
