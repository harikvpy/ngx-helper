import { CommonModule } from '@angular/common';
import { Component, computed, input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { errorTailorImports } from '@ngneat/error-tailor';
import { SPMatEntityCrudCreateEditBridge } from '@smallpearl/ngx-helper/mat-entity-crud';
import { showServerValidationErrors } from './validation-error-handler';
import { Observable, of } from 'rxjs';
import { MOCK_USER, User } from '../entity-list-demo/user';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    errorTailorImports,
  ],
  selector: 'app-create-edit-entity-demo',
  template: `
    <ng-template let-error let-text="text" #tpl>
      <mat-error>{{ text }}</mat-error>
    </ng-template>

  @if (init$|async) {
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      class="d-flex flex-column align-items-start"
      errorTailor
    >
      <div class="d-flex flex-row gap-1">
        <mat-form-field>
          <mat-label>Firstname</mat-label>
          <input matInput formControlName="firstName" [controlErrorAnchor]="errorAnchorFirstName" />
          <mat-error>
            <ng-template controlErrorAnchor #errorAnchorFirstName="controlErrorAnchor"></ng-template>
          </mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Lastname</mat-label>
          <input matInput formControlName="lastName" [controlErrorAnchor]="errorAnchorLastName" />
          <mat-error>
            <ng-template controlErrorAnchor #errorAnchorLastName="controlErrorAnchor"></ng-template>
          </mat-error>
        </mat-form-field>
      </div>
      <mat-form-field>
        <mat-label>Gender</mat-label>
        <mat-select formControlName="gender" [controlErrorAnchor]="errorAnchorGender" >
          <mat-option value="male">Male</mat-option>
          <mat-option value="female">Female</mat-option>
        </mat-select>
        <mat-error>
          <ng-template controlErrorAnchor #errorAnchorGender="controlErrorAnchor"></ng-template>
        </mat-error>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Cell</mat-label>
        <input matInput formControlName="cell" [controlErrorAnchor]="errorAnchorCell" />
        <mat-error>
          <ng-template controlErrorAnchor #errorAnchorCell="controlErrorAnchor"></ng-template>
        </mat-error>
      </mat-form-field>

      <div class="mt-2 d-flex gap-2">
        <button type="button" color="secondary" mat-raised-button (click)="form.reset()">Reset</button>
        <button
          type="submit"
          color="primary"
          mat-raised-button
          [disabled]="form.invalid"
        >
          Save
        </button>
      </div>
    </form>
  }
  `,
  styles: `

  `,
})
export class CreateEditEntityDemoComponent implements OnInit, OnDestroy {
  form!: FormGroup<{
    firstName: FormControl<string>,
    lastName: FormControl<string>,
    gender: FormControl<string>,
    cell: FormControl<string>,
  }>;
  // update = false;
  init$!: Observable<any>;
  bridge = input<SPMatEntityCrudCreateEditBridge>();
  entity = input<User>();
  creating = computed(() => !this.entity()|| !this.entity()?.id)

  canCancelEdit = () => {
    return this._canCancelEdit();
  }

  _canCancelEdit() {
    if (this.form.touched) {
      return window.confirm('Lose Changes?');
    }
    return true;
  }

  constructor(
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    console.log(`CreateEditEntityDemoComponent.ngOnInit`);
    this.init$ = of(this.entity() ? this.entity() : MOCK_USER)
    this.form = this.createForm(this.entity())
    this.bridge()?.registerCanCancelEditCallback(this.canCancelEdit);
  }

  ngOnDestroy(): void {
    console.log(`CreateEditEntityDemoComponent.ngOnDestroy`);
  }

  createForm(entity?: User) {
    return new FormGroup({
      firstName: new FormControl(entity ? entity.name.first : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      lastName: new FormControl(entity ? entity.name.last : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      gender: new FormControl(entity ? entity.gender : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      cell: new FormControl(entity ? entity.cell : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
    });
  }
  onSubmit() {
    const value = this.form.value;
    const bridge = this.bridge();
    const obs = this.creating() ? bridge?.create(value) : bridge?.update(this.entity()?.cell, value);
    obs?.pipe(
      showServerValidationErrors(this.form)
    ).subscribe();
  }
}
