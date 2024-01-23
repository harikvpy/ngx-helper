import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QQMatFileInputComponent } from './mat-file-input.component';

describe('QQMatFileInputComponent', () => {
  let component: QQMatFileInputComponent;
  let fixture: ComponentFixture<QQMatFileInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QQMatFileInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QQMatFileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
