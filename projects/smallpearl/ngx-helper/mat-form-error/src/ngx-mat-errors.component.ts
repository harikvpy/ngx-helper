import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  InjectionToken,
  Input,
  ViewEncapsulation,
  inject,
  type OnDestroy,
  type QueryList,
} from '@angular/core';
import {
  ReplaySubject,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
  type Observable,
} from 'rxjs';
import {
  NgxMatErrorControl,
  provideDefaultNgxMatErrorControl,
} from './ngx-mat-error-control';
import {
  NGX_MAT_ERROR_DEF,
  type INgxMatErrorDef,
} from './ngx-mat-error-def.directive';
import type {
  ErrorMessages,
  ErrorTemplate,
  NgxMatErrorControls,
} from './types';
import { coerceToObservable } from './utils/coerce-to-observable';
import { distinctUntilErrorChanged } from './utils/distinct-until-error-changed';
import { findErrorsForControl } from './utils/find-error-for-control';
import { getAbstractControls } from './utils/get-abstract-controls';
import { getControlWithError } from './utils/get-control-with-error';

/**
 * Default error messages for form controls. These messages can be overridden
 * by providing custom messages using the {@link NGX_MAT_ERROR_ADDL_OPTIONS}
 * injection token. Typically, this is initialized in the root module
 * (or AppComponent) of the application, providing the app with a global set
 * of validation error messages.
 *
 * Messages specific to each form can be provided using the
 * {@link NGX_MAT_ERROR_ADDL_OPTIONS} injection token (see below).
 */
export const NGX_MAT_ERROR_DEFAULT_OPTIONS = new InjectionToken<
  ErrorMessages | Observable<ErrorMessages>
>('NGX_MAT_ERROR_DEFAULT_OPTIONS');

/**
 * Additional error messages to be merged with the default error messages.
 * These messages will override the default messages if the same key is
 * provided. This is useful for adding custom error messages specific to a
 * form, without having to redefine all the default messages.
 *
 * Typically, this is provided in the component or module where the form
 * is defined.
 */
export const NGX_MAT_ERROR_ADDL_OPTIONS = new InjectionToken<
  ErrorMessages | Observable<ErrorMessages>
>('NGX_MAT_ERROR_ADDL_OPTIONS');

@Component({
    selector: 'ngx-mat-errors, [ngx-mat-errors]',
    template: `<ng-template #defaultTemplate let-error>{{ error[0] }}</ng-template
    >@if( error$ | async; as error) {
    <ng-template
      [ngTemplateOutlet]="error.template ?? defaultTemplate"
      [ngTemplateOutletContext]="error"
    ></ng-template>
    }`,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AsyncPipe, NgTemplateOutlet],
    host: {
        class: 'ngx-mat-errors',
    },
    providers: [provideDefaultNgxMatErrorControl()]
})
export class NgxMatErrors implements OnDestroy {
  private readonly messages$ = coerceToObservable(
    inject(NGX_MAT_ERROR_DEFAULT_OPTIONS)
  );
  private readonly addlMessages$ = coerceToObservable(
    inject(NGX_MAT_ERROR_ADDL_OPTIONS, {optional: true}) ?? of({})
  );

  private readonly defaultControl = inject(NgxMatErrorControl, {
    host: true,
  });
  private readonly controlChangedSubject =
    new ReplaySubject<NgxMatErrorControls>(1);

  protected error$!: Observable<ErrorTemplate>;

  // ContentChildren is set before ngAfterContentInit which is before ngAfterViewInit.
  // Before ngAfterViewInit lifecycle hook we can modify the error$ observable without needing another change detection cycle.
  // This elaborates the need of rxjs defer;
  @ContentChildren(NGX_MAT_ERROR_DEF, { descendants: true })
  protected set customErrorMessages(queryList: QueryList<INgxMatErrorDef>) {
    const firstControlWithError$ = this.controlChangedSubject.pipe(
        switchMap((_controls) => {
          const controls = getAbstractControls(
            _controls || this.defaultControl.get()
          );
          if (!controls) {
            return of(null);
          }
          return getControlWithError(controls);
        })
      ),
      customErrorMessages$ = (
        queryList.changes as Observable<QueryList<INgxMatErrorDef>>
      ).pipe(startWith(queryList));
    this.error$ = combineLatest([
      firstControlWithError$,
      customErrorMessages$,
      this.messages$,
      this.addlMessages$,
    ]).pipe(
      map(([controlWithError, customErrorMessages, messages, addlMessages]) => {
        if (!controlWithError) {
          return;
        }
        const allMessages = { ...messages, ...addlMessages };
        const errors = controlWithError.errors!,
          errorsOrErrorDef = findErrorsForControl(
            controlWithError,
            allMessages,
            customErrorMessages.toArray()
          );
        if (!errorsOrErrorDef) {
          return;
        }
        // errorsOrErrorDef: INgxMatErrorDef
        if (typeof errorsOrErrorDef === 'object' && !Array.isArray(errorsOrErrorDef)) {
          return {
            template: errorsOrErrorDef.template,
            $implicit: errors[errorsOrErrorDef.ngxMatErrorDefFor],
          };
        }
        // errorsOrErrorDef: string[]
        const msgs = errorsOrErrorDef.map(key => {
          const message = allMessages[key];
          return typeof message === 'function'
          ? message(errors[key])
          : message
        });
        return {
          template: undefined,
          $implicit: msgs
        };
      }),
      distinctUntilChanged(distinctUntilErrorChanged)
    );
  }

  // eslint-disable-next-line @angular-eslint/no-input-rename
  /**
   * @deprecated will be changed to a signal and it won't be possible to set the property from TS.
   * Instead of setting it in a directive, the directive should extend the {@link NgxMatErrorControl } class
   * and provide itself as it.
   */
  @Input('ngx-mat-errors')
  public set control(control: NgxMatErrorControls) {
    this.controlChangedSubject.next(control);
  }

  /** @ignore */
  public ngOnDestroy(): void {
    this.controlChangedSubject.complete();
  }
}
