import { TestBed } from '@angular/core/testing';

import { NgxJdatepickerService } from './ngx-jdatepicker.service';

describe('NgxJdatepickerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgxJdatepickerService = TestBed.get(NgxJdatepickerService);
    expect(service).toBeTruthy();
  });
});
