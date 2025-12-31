import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EmbeddedViewRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SPMatHostBusyWheelDirective } from '@smallpearl/ngx-helper/mat-busy-wheel';
import { Observable, of, Subscription, tap } from 'rxjs';
import { getEntityCrudConfig } from './default-config';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';
import { SPMatEntityCrudConfig, SPMatEntityCrudCreateEditBridge } from './mat-entity-crud-types';

@Component({
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    TranslocoModule,
    SPMatHostBusyWheelDirective,
  ],
  selector: 'sp-create-edit-entity-host',
  template: `
    <div
      [class]="
        'sp-mat-crud-form-wrapper ' +
        entityCrudComponentBase().getFormPaneWrapperClass()
      "
      spHostBusyWheel="formBusyWheel"
      *transloco="let t"
    >
      <div
        [class]="
          'sp-mat-crud-form-content ' +
          entityCrudComponentBase().getFormPaneContentClass()
        "
      >
        <div class="create-edit-topbar">
          <div class="title">
            @if (title()) {
            {{ title() | async }}
            } @else {
            {{
              t('spMatEntityCrud.' + (entity() ? 'editItem' : 'newItem'), {
                item: (this._itemLabel() | async)
              })
            }}
            }
          </div>
          <div class="spacer"></div>
          <div class="close">
            <button mat-icon-button (click)="onClose()">
              <mat-icon>cancel</mat-icon>
            </button>
          </div>
        </div>
        <div class="form-container">
          <ng-container #clientFormContainer></ng-container>
        </div>
      </div>
    </div>
  `,
  styles: `
  .sp-mat-crud-form-wrapper {
    width: 100% !important;
    height: 100% !important;
  }
  .sp-mat-crud-form-content {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.4em;
  }
  .create-edit-topbar {
    display: flex;
    flex-direction: row;
    align-items: center;
    min-height: 48px;
    padding: 0.4em;
  }
  .form-container {
    padding-top: 0.4em;
    flex-grow: 1;
    overflow: auto;
  }
  .create-edit-topbar .title {
    font-size: 1.5em;
    font-weight: 500;
  }
  .create-edit-topbar .spacer {
    flex-grow: 1;
  }
  .create-edit-topbar .close {
  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormViewHostComponent<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements SPMatEntityCrudCreateEditBridge, OnInit, OnDestroy
{
  entityCrudComponentBase =
    input.required<SPMatEntityCrudComponentBase<TEntity, IdKey>>();
  clientViewTemplate = input<TemplateRef<any> | null>(null);

  _itemLabel = computed<Observable<string>>(() => {
    const label = this.entityCrudComponentBase().getItemLabel();
    return label instanceof Observable ? label : of(label);
  });
  _itemLabelPlural = computed<Observable<string>>(() => {
    const label = this.entityCrudComponentBase().getItemLabelPlural();
    return label instanceof Observable ? label : of(label);
  });

  entity = signal<TEntity | undefined>(undefined);
  title = signal<Observable<string> | undefined>(undefined);
  params = signal<any>(undefined);
  clientFormView!: EmbeddedViewRef<any> | null;
  vc = viewChild('clientFormContainer', { read: ViewContainerRef });
  config!: SPMatEntityCrudConfig;
  sub$ = new Subscription();
  transloco = inject(TranslocoService);

  constructor() {
    this.config = getEntityCrudConfig();
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    this.sub$.unsubscribe();
  }

  show(entity: TEntity | undefined, params?: any) {
    this.entity.set(entity);
    if (params && params?.title) {
      this.title.set(
        params.title instanceof Observable ? params.title : of(params.title)
      );
    } else {
      // this.title.set(entity ? this.config.i18n.editItemLabel(this.itemLabel()) : this.config.i18n.newItemLabel(this.itemLabel()));
      // this.title.set(
      //   this.transloco.translate(entity ? 'editItem' : 'newItem', {
      //     item: this.itemLabel(),
      //   })
      // );
    }
    this.params.set(params);
    this.createClientView();
  }

  // BEGIN SPMatEntityCrudCreateEditBridge METHODS //
  getEntityName(): string {
    return this.entityCrudComponentBase().getEntityName();
  }

  getIdKey(): string {
    return this.entityCrudComponentBase().getIdKey();
  }

  getEntityUrl(entityId: any): string {
    return this.entityCrudComponentBase().getEntityUrl(entityId);
  }

  close(cancel: boolean) {
    this.entityCrudComponentBase().closeCreateEdit(cancel);
    // destroy the client's form component
    this.destroyClientView();
  }

  registerCanCancelEditCallback(callback: () => boolean) {
    this.entityCrudComponentBase().registerCanCancelEditCallback(callback);
  }

  create(entityValue: any) {
    // console.log(
    //   `SPCreateEditEntityHostComponent.create - entity: ${JSON.stringify(
    //     entityValue
    //   )}`
    // );
    const crudComponent = this.entityCrudComponentBase();
    return crudComponent
      ?.create(entityValue)
      .pipe(tap(() => this.close(false)));
  }

  update(id: any, entityValue: any) {
    // console.log(
    //   `SPCreateEditEntityHostComponent.update - id: ${String(
    //     id
    //   )}, entity: ${entityValue}`
    // );
    const crudComponent = this.entityCrudComponentBase();
    return crudComponent
      ?.update(id, entityValue)
      .pipe(tap(() => this.close(false)));
  }

  loadEntity(
    id: string | number,
    params: string | HttpParams
  ): Observable<TEntity> {
    return this.entityCrudComponentBase().loadEntity(id, params);
  }
  // END SPMatEntityCrudCreateEditBridge METHODS //

  /**
   * Creates the client view provided via template
   */
  createClientView() {
    /** Render preview component if one was provided */
    const ft = this.clientViewTemplate();
    const vc = this.vc();
    if (ft && vc) {
      this.clientFormView = vc.createEmbeddedView(ft, {
        $implicit: {
          bridge: this,
          entity: this.entity(),
          params: this.params(),
        },
      });
      this.clientFormView.detectChanges();
    }
  }

  destroyClientView() {
    if (this.clientFormView) {
      this.clientFormView.destroy();
      this.clientFormView = null;
    }
  }

  onClose() {
    // Can we give the client form component a chance to intercept this
    // and cancel the closure?
    if (this.entityCrudComponentBase().canCancelEdit()) {
      this.entityCrudComponentBase().closeCreateEdit(true);
      this.destroyClientView();
    }
  }
}
