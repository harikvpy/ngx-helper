import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  input,
  Optional,
  Output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import {
  SPContextMenuItem,
  SPMatContextMenuComponent,
} from '@smallpearl/ngx-helper/mat-context-menu';
import {
  SP_MAT_ENTITY_LIST_CONFIG,
  SPMatEntityListComponent,
  SPMatEntityListConfig,
} from '@smallpearl/ngx-helper/mat-entity-list';
import { Subscription, tap } from 'rxjs';
import { SPMatEntityCrudConfig } from './mat-entity-crud-types';
import { SP_MAT_ENTITY_CRUD_CONFIG } from './providers';
import { OverlayModule } from '@angular/cdk/overlay';

const DefaultSPMatEntityCrudConfig: SPMatEntityCrudConfig = {
  i18n: {
    newItemLabel: (itemLabel: string) => `New ${itemLabel}`,
    editItemLabel: (itemLabel: string) => `Edit ${itemLabel}`,
    edit: 'Edit',
    delete: 'Delete',
    deleteItemHeader: 'Confirm Delete {{ item }}',
    deleteItemMessage: 'Are you sure you want to delete this {{ item }}',
    itemDeletedNotification: '{{ item }} deleted!',
  },
  i18nTranslate: (label: string, context?: any) => {
    let XlatedString = label;
    if (context) {
      for (const key in context) {
        const value = context[key];
        if (value) {
          const re = new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}');
          XlatedString.replace(re, value);
        }
      }
    }
    return XlatedString;
  },
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatTableModule,
    MatSnackBarModule,
    OverlayModule,
    SPMatEntityListComponent,
    SPMatContextMenuComponent,
  ],
  selector: 'sp-mat-entity-crud',
  template: `
    <div cdkOverlayOrigin #trigger="cdkOverlayOrigin">
      <div class="action-bar">
        <div class="action-bar-title">
          {{ itemsLabel() }}
        </div>
        <span class="spacer"></span>
        <div class="action-bar-actions">
          <button
            mat-raised-button
            color="primary"
            (click)="onNewItem($event)"
            [routerLink]="newItemLink()"
          >
            {{ config.i18n.newItemLabel(this.itemLabel()) }}
          </button>
        </div>
      </div>
      <sp-mat-entity-list
        [endpoint]="endpoint()"
        [entityLoaderFn]="entityLoaderFn()"
        [columns]="columns()"
        [idKey]="idKey()"
        [pagination]="pagination()"
        [paginator]="paginator()"
        [pageSize]="pageSize()"
        [sorter]="sorter()"
        [disableSort]="disableSort()"
      >
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let element">
            @if (itemActions().length) {
            <sp-mat-context-menu
              [menuItems]="itemActions()"
              (selected)="onItemAction($event, element)"
              [contextData]="element"
            ></sp-mat-context-menu>
            }
          </td>
        </ng-container>
      </sp-mat-entity-list>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen()"
    >
      <ul class="example-list">
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    </ng-template>
  `,
  styles: `
  .action-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-bottom: 0.5em;
  }
  .action-bar-title {
    font-size: 1.5em;
    font-weight: 600;
  }
  .spacer {
    flex-grow: 1;
  }
  .action-bar-actions {
    text-align: end;
  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPMatEntityCrudComponent<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> extends SPMatEntityListComponent<TEntity, IdKey> {
  itemLabel = input.required<string>();
  itemsLabel = input.required<string>();
  itemActions = input<SPContextMenuItem[]>([]);
  newItemLink = input<string | string[]>();
  /**
   * Event raised for user selecting an item action. It's also raised
   * for 'New <Item>' action, if 'newItemLink' property is not set.
   */
  @Output() action = new EventEmitter<{role: string, entity?: TEntity}>();

  busyWheelId = `entityCrudBusyWheel-${Date.now()}`;
  sub$ = new Subscription();
  spEntitiesList = viewChild(SPMatEntityListComponent<TEntity, IdKey>);
  override config!: SPMatEntityCrudConfig;

  isOpen = signal(false);

  constructor(
    @Optional()
    @Inject(SP_MAT_ENTITY_CRUD_CONFIG)
    protected crudConfig: SPMatEntityCrudConfig,
    @Optional()
    @Inject(SP_MAT_ENTITY_LIST_CONFIG)
    private entityListConfig: SPMatEntityListConfig,
    http: HttpClient,
    private snackBar: MatSnackBar,
  ) {
    super(http, entityListConfig);
    this.config = {
      ...DefaultSPMatEntityCrudConfig,
      ...(crudConfig ? crudConfig : {}),
    };
  }

  override ngOnInit() {}

  override ngOnDestroy(): void {
    this.sub$.unsubscribe();
  }

  onItemAction(role: string, entity: TEntity) {
    if (role === 'delete') {
      this.onDelete(entity);
    } else {
      this.action.emit({role, entity});
    }
  }

  onNewItem(event: Event) {
    if (!this.newItemLink() || this.newItemLink()?.length == 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.action.emit({role: '_new_'});
    }
    // fall through to let routerLink act
  }

  async onDelete(entity: TEntity) {
    // Do the delete prompt asynchronously so that the context menu is
    // dismissed before the prompt is displayed.

    setTimeout(() => {
      const yes = confirm(this.config.i18n.deleteItemMessage);
      if (yes) {
        const entityId = (entity as any)[this.idKey()];
        this.sub$.add(
          this.http
            .delete(this.getUrl(this.endpoint()) + `${entityId}/`)
            .pipe(
              // TODO: how to display a busy wheel?
              // showBusyWheelUntilComplete(this.busyWheelId),
              tap(() => {
                this.spEntitiesList()!.removeEntity(entityId);
                if (this.config?.i18nTranslate) {
                  // TODO: customize by providing an interface via SPMatEntityCrudConfig?
                  const deletedMessage = this.config.i18nTranslate(this.config.i18n.itemDeletedNotification, {item: this.itemLabel()});
                  this.snackBar.open(deletedMessage);
                }
              })
            )
            .subscribe()
        );
      }
    });
  }

  override getUrl(endpoint: string) {
    return this.entityListConfig?.urlResolver ? this.entityListConfig?.urlResolver(endpoint) : endpoint;
  }
}

