import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { MatInputHarness } from '@angular/material/input/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  defaultImports,
  defaultProviders,
} from './ngx-mat-errors.component.spec';

describe('NgxErrorList', () => {
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
    });
  });

  @Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...defaultImports],
    providers: [...defaultProviders],
    template: `
      <mat-form-field>
        <mat-label>Label</mat-label>
        <input matInput [formControl]="control" />
        <div ngx-error-list></div>
      </mat-form-field>
    `,
  })
  class NgxMatErrorWithoutDef {
    control = new FormControl('ab', [
      Validators.minLength(3),
      Validators.email,
    ]);
  }

  let fixture: ComponentFixture<NgxMatErrorWithoutDef>;
  beforeEach(() => {
    fixture = TestBed.createComponent(NgxMatErrorWithoutDef);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should display only one error message when control is touched and invalid', async () => {
    const matInput = await loader.getHarness(MatInputHarness);
    await matInput.blur();
    const errorList = fixture.debugElement.queryAll(By.css('li'));
    expect(errorList.length).toEqual(2);
  });
});
