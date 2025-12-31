import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { setServerErrorsAsFormErrors } from '@smallpearl/ngx-helper/forms';
import { map, Observable, Subscription } from 'rxjs';
// import { getEntityCrudConfig } from './default-config';
import { sideloadToComposite } from '@smallpearl/ngx-helper/sideload';
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
 *    server, override `getFormValue()` method and do it there before returning
 *    the modified values.
 *
 * 4. Wire up the form in the template as:
 *
 *    ```
 *    @if (loadEntity$ | async) {
 *    <form [formGroup]='form'.. (ngSubmit)="onSubmit()">
 *      <button type="submit">Submit</button>
 *    </form>
 *    } @else {
 *     <div>Loading...</div>
 *    }
 *    ```
 *    Here `loadEntity$` is an Observable<boolean> that upon emission of `true`
 *    indicates that the entity has been loaded from server (in case of edit)
 *    and the form is ready to be displayed. Note that if the full entity was
 *    passed in the `entity` input property, then no server load is necessary
 *    and the form will be created immediately.
 *
 * 5. If the entity shape required by the form requires additional parameters
 *    to be loaded from server, initialize `entity` property with it's id.
 *    Then override the `getLoadEntityParams()` method to return the additional
 *    load parameters. The parameters returned by this method will be
 *    passed to the `loadEntity()` method of the bridge interface.
 */
@Component({
  selector: '_#_sp-mat-entity-crud-form-base_#_',
  template: ``,
  standalone: false,
})
export abstract class SPMatEntityCrudFormBase<
  TFormGroup extends AbstractControl,
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements OnInit, OnDestroy
{
  _form = signal<TFormGroup | undefined>(undefined);
  entity = input.required<TEntity|TEntity[IdKey]>();
  bridge = input.required<SPMatEntityCrudCreateEditBridge>();
  params = input<any>();
  loadEntity$!: Observable<boolean>;
  _entity = signal<TEntity | undefined>(undefined);
  sub$ = new Subscription();
  // Force typecast to TFormGroup so that we can use it in the template
  // without having to use the non-nullable operator ! with every reference
  // of form(). In any case the form() signal is always set in ngOnInit()
  // method after the form is created. And if form() is not set, then there
  // will be errors while loading the form in the template.
  form = computed(() => this._form() as TFormGroup);
  // crudConfig = getEntityCrudConfig();
  transloco = inject(TranslocoService);
  cdr = inject(ChangeDetectorRef);
  http = inject(HttpClient);

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
    this.loadEntity$ = (
      typeof this.entity() === 'object' || this.entity() === undefined
        ? new Observable<TEntity | undefined>((subscriber) => {
            subscriber.next(this.entity() as TEntity | undefined);
            subscriber.complete();
          })
        : this.bridge()?.loadEntity(
            this.entity() as any,
            this.getLoadEntityParams()
          )
    ).pipe(
      map((resp) => {
        const compositeEntity = this.getEntityFromLoadResponse(resp);
        this._entity.set(compositeEntity);
        this._form.set(this.createForm(compositeEntity));
        this.bridge()?.registerCanCancelEditCallback(this.canCancelEdit);
        return true;
      })
    );
  }

  ngOnDestroy() {
    this.sub$.unsubscribe();
  }

  /**
   * Additional parameters for loading the entity, in case this.entity() value
   * is of type TEntity[IdKey].
   * @returns
   */
  getLoadEntityParams(): string | HttpParams {
    return '';
  }

  /**
   * Return the TEntity object from the response returned by the
   * loadEntity() method of the bridge. Typically entity load return the actual
   * entity object itself. In some cases, where response is sideloaded, the
   * default implementation here uses the `sideloadToComposite()` utility to
   * extract the entity from the response after merging (inplace) the
   * sideloaded data into a composite.
   *
   * If you have a different response shape, override this method to
   * extract the TEntity object from the response.
   * @param resp
   * @returns
   */
  getEntityFromLoadResponse(resp: any): TEntity | undefined {
    if (!resp) {
      return undefined;
    }
    const sideloaded = sideloadToComposite(
      resp,
      this.bridge().getEntityName(),
      this.bridge().getIdKey()
    );
    return sideloaded;
  }

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
    const form = this.form();
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
          setServerErrorsAsFormErrors(
            this._form() as unknown as UntypedFormGroup,
            this.cdr
          )
        )
        .subscribe()
    );
  }

  // create(values: any): Observable<TEntity> {
  //   const bridge = this.bridge();
  //   if (bridge) {
  //     return bridge.create(values);
  //   }
  //   return this.http
  //     .post<TEntity>('', values)
  //     .pipe(map((resp) => this.getEntityFromLoadResponse(resp) as TEntity));
  // }

  // update(id: any, values: any): Observable<TEntity> {
  //   const bridge = this.bridge();
  //   if (bridge) {
  //     return bridge.update(id, values);
  //   }
  //   return this.http
  //     .patch<TEntity>(`/${String(id)}`, values)
  //     .pipe(map((resp) => this.getEntityFromLoadResponse(resp) as TEntity));
  // }
}
