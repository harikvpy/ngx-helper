import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatFileInputComponent } from './mat-file-input.component';

describe('MatFileInputComponent', () => {
  let component: MatFileInputComponent;
  let fixture: ComponentFixture<MatFileInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatFileInputComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatFileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
