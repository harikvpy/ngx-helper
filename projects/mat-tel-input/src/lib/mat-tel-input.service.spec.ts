import { TestBed } from '@angular/core/testing';

import { MatTelInputService } from './mat-tel-input.service';

describe('MatTelInputService', () => {
  let service: MatTelInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatTelInputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
