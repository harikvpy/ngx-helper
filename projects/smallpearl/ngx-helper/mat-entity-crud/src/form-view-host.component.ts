import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EmbeddedViewRef,
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
import { SPBusyWheelModule } from '@smallpearl/ngx-helper/mat-busy-wheel';
import { Subscription, tap } from 'rxjs';
import { getEntityCrudConfig } from './default-config';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';
import { SPMatEntityCrudConfig, SPMatEntityCrudCreateEditBridge } from './mat-entity-crud-types';

@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, SPBusyWheelModule],
  selector: 'sp-create-edit-entity-host',
  template: `
    <div spHostBusyWheel="formBusyWheel">
      <div class="create-edit-topbar">
        <div class="title">
          {{ title() }}
        </div>
        <div class="spacer"></div>
        <div class="close">
          <button mat-icon-button (click)="onClose()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      <ng-container #clientFormContainer></ng-container>
    </div>
  `,
  styles: `
    .create-edit-topbar {
      display: flex;
      flex-direction: row;
      align-items: center;
      min-height: 48px;
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
export class FormViewHostComponent<TEntity> implements SPMatEntityCrudCreateEditBridge, OnInit, OnDestroy
{
  entityCrudComponentBase = input.required<SPMatEntityCrudComponentBase<TEntity>>();
  clientViewTemplate = input<TemplateRef<any> | null>(null);
  itemLabel = input.required<string>();
  itemLabelPlural = input.required<string>();

  entity = signal<TEntity|undefined>(undefined);
  title = signal<string>('');
  params = signal<any>(undefined);
  clientFormView!: EmbeddedViewRef<any> | null;
  vc = viewChild('clientFormContainer', { read: ViewContainerRef });
  config!: SPMatEntityCrudConfig;
  sub$ = new Subscription();

  constructor() {
    this.config = getEntityCrudConfig();
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    this.sub$.unsubscribe();
  }

  show(entity: TEntity|undefined, params?: any) {
    this.entity.set(entity);
    if (params && params?.title) {
      this.title.set(params.title);
    } else {
      this.title.set(entity ? this.config.i18n.editItemLabel(this.itemLabel()) : this.config.i18n.newItemLabel(this.itemLabel()));
    }
    this.params.set(params);
    this.createClientView();
  }

  close(cancel: boolean) {
    this.entityCrudComponentBase().closeCreateEdit(cancel);
    // destroy the client's form component
    this.destroyClientView();
  }

  refreshEntities() {
    this.entityCrudComponentBase().refreshEntities();
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
    return crudComponent?.create(entityValue).pipe(
      tap(() => this.close(false)),
    );
  }

  update(id: any, entityValue: any) {
    // console.log(
    //   `SPCreateEditEntityHostComponent.update - id: ${String(
    //     id
    //   )}, entity: ${entityValue}`
    // );
    const crudComponent = this.entityCrudComponentBase();
    return crudComponent?.update(id, entityValue).pipe(
      tap(() => this.close(false)),
    );
  }

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
          params: this.params()
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
