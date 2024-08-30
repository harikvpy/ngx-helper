import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QQMatFileInputComponent } from './mat-file-input.component';

describe('MatFileInputComponent', () => {
  let component: QQMatFileInputComponent;
  let fixture: ComponentFixture<QQMatFileInputComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        QQMatFileInputComponent
      ],
    });

    fixture = TestBed.createComponent(QQMatFileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


});
