import { ChangeDetectorRef, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { setServerErrorsAsFormErrors } from '@smallpearl/ngx-helper/forms';
import { Subscription } from 'rxjs';
import { getEntityCrudConfig } from './default-config';
import { SPMatEntityCrudCreateEditBridge } from './mat-entity-crud-types';

/**
 * This is a convenience base class that clients can derive from to implement
 * their CRUD form component. Particularly this class registers the change
 * detection hook which will be called when the user attempts to close the
 * form's parent container pane via the Close button on the top right.
 *
 * This button behaves like a Cancel button in a desktop app and therefore if
 * the user has entered any data in the form's controls, (determined by
 * checking form.touched), then a 'Lose Changes' prompt is displayed allowing
 * the user to cancel the closure.
 *
 * The @Component is fake just to keep the VSCode angular linter quiet.
 *
 * To use this class:-
 *
 * 1. Declare a FormGroup<> type as
 *
 *      ```
 *      type MyForm = FormGroup<{
 *        name: FormControl<string>;
 *        type: FormControl<string>;
 *        notes: FormControl<string>;
 *      }>;
 *      ```
 *
 * 2. Derive your form's component class from this and implement the
 *    createForm() method returing the FormGroup<> instance that matches
 *    the FormGroup concrete type above.
 *
 *    ```
 *    class MyFormComponent extends SPMatEntityCrudFormBase<MyForm, MyEntity> {
 *      constructor() {
 *        super()
 *      }
 *
 *      createForm() {
 *        return new FormGroup([...])
 *      }
 *    }
 *    ```
 *
 * 3. If you form's value requires manipulation before being sent to the
 *    server, override getFormValue() method and do it there before returning
 *    the modified values.
 *
 * 4. Wire up the form in the template as:
 *
 *    ```
 *    <form [formGroup]='form'.. (ngSubmit)="onSubmit()">
 *      <button type="submit">Submit</button>
 *    </form>
 *    ```
 */
@Component({
    selector: '_#_sp-mat-entity-crud-form-base_#_', template: ``,
    standalone: false
})
export abstract class SPMatEntityCrudFormBase<
  TFormGroup extends AbstractControl,
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements OnInit, OnDestroy
{
  _form = signal<TFormGroup|undefined>(undefined);
  entity = input.required<TEntity>();
  bridge = input.required<SPMatEntityCrudCreateEditBridge>();
  params = input<any>();
  sub$ = new Subscription();
  // Force typecast to TFormGroup so that we can use it in the template
  // without having to use the non-nullable operator ! with every reference
  // of form(). In any case the form() signal is always set in ngOnInit()
  // method after the form is created. And if form() is not set, then there
  // will be errors while loading the form in the template.
  form = computed(() => this._form() as TFormGroup);
  crudConfig = getEntityCrudConfig();
  transloco = inject(TranslocoService);

  cdr = inject(ChangeDetectorRef);

  canCancelEdit = () => {
    return this._canCancelEdit();
  };

  _canCancelEdit() {
    const form = this._form();
    if (form && form.touched) {
      return window.confirm(
        this.transloco.translate('spMatEntityCrud.loseChangesConfirm')
      );
    }
    return true;
  }

  ngOnInit() {
    this._form.set(this.createForm(this.entity()));
    this.bridge()?.registerCanCancelEditCallback(this.canCancelEdit);
  }

  ngOnDestroy() {
    this.sub$.unsubscribe();
  }

  // get form(): TFormGroup|undefined {
  //   return this._form();
  // }

  // set form(f: TFormGroup) {
  //   this._form.set(f);
  // }

  /**
   * Create the TFormGroup FormGroup class that will be used for the reactive
   * form.
   * @param entity
   */
  abstract createForm(entity: TEntity | undefined): TFormGroup;

  /**
   * Override to customize the id key name if it's not 'id'
   * @returns The name of the unique identifier key that will be used to
   * extract the entity's id for UPDATE operation.
   */
  getIdKey() {
    return 'id';
  }

  /**
   * Return the form's value to be sent to server as Create/Update CRUD
   * operation data.
   * @returns
   */
  getFormValue() {
    const form = this.form()
    return form ? form.value : undefined;
  }

  onSubmit() {
    const value = this.getFormValue();
    const obs = !this.entity()
      ? this.bridge()?.create(value)
      : this.bridge()?.update((this.entity() as any)[this.getIdKey()], value);
    this.sub$.add(
      obs
        ?.pipe(
          setServerErrorsAsFormErrors(this._form() as unknown as UntypedFormGroup, this.cdr)
        )
        .subscribe()
    );
  }
}
