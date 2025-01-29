import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatInputHarness } from '@angular/material/input/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  defaultImports,
  defaultProviders,
} from './ngx-mat-errors.component.spec';
import { NgIf } from '@angular/common';

xdescribe('NgxErrorList', () => {
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
    });
  });

  @Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...defaultImports, NgIf],
    providers: [...defaultProviders],
    template: `
      <form [formGroup]="form">
        <div [ngx-error-list]="form"></div>
        <mat-form-field>
          <mat-label>Label</mat-label>
          <input matInput formControlName="email" />
          <mat-error ngx-mat-errors></mat-error>
        </mat-form-field>
      </form>
    `,
  })
  class NgxMatErrorWithoutDef {
    form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.minLength(3), Validators.email]),
    });
  }

  let fixture: ComponentFixture<NgxMatErrorWithoutDef>;
  beforeEach(() => {
    fixture = TestBed.createComponent(NgxMatErrorWithoutDef);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should display only one error message when control is touched and invalid', async () => {
    fixture.componentInstance.form.get('email')?.setErrors({required: true});
    const matInput = await loader.getHarness(MatInputHarness);
    await matInput.blur();
    fixture.componentInstance.form.setErrors({required: true, email: true});
    await new Promise(res => setTimeout(res, 100));
    fixture.detectChanges();
    const errorList = fixture.debugElement.queryAll(By.css('li'));
    expect(errorList.length).toEqual(2);
  });
});
