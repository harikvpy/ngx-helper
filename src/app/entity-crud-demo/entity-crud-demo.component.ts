import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { getEntitiesIds } from '@ngneat/elf-entities';
import { SPEntityFieldSpec } from '@smallpearl/ngx-helper/entity-field';
import { spFormatCurrency } from '@smallpearl/ngx-helper/locale';
import { SPContextMenuItem } from '@smallpearl/ngx-helper/mat-context-menu';
import {
  SP_MAT_ENTITY_CRUD_CONFIG,
  SPMatEntityCrudComponent,
  SPMatEntityCrudConfig,
} from '@smallpearl/ngx-helper/mat-entity-crud';
import { of } from 'rxjs';
import { SPMatEntityCrudPreviewPaneComponent } from '../../../projects/smallpearl/ngx-helper/mat-entity-crud/src/preview-pane.component';
import { MyPaginator } from '../entity-list-demo/paginater';
import { User } from '../entity-list-demo/user';
import { CreateEditEntityDemoComponent } from './create-edit-entity-demo.component';
import { Invoice, INVOICES } from './data';
import { PreviewInvoiceComponent } from './preview-demo.component';

const EntityCrudConfig: SPMatEntityCrudConfig = {
  i18n: {
    newItemLabel: (itemLabel: string) => 'New USER',
    editItemLabel: (itemLabel: string) => 'Edit USER',
    edit: 'Update',
    delete: 'Remove',
    deleteItemHeader: (itemLabel: string) => `Delete ${itemLabel}?`,
    deleteItemMessage: (itemLabel: string) =>
      `Are you sure you want to delete this ${itemLabel.toLocaleLowerCase()}?`,
    itemDeletedNotification: (itemLabel: string) => `${itemLabel} deleted.`,
    createdItemNotification: (itemLabel: string) => `${itemLabel} created.`,
    updatedItemNotification: (itemLabel: string) => `${itemLabel} updated.`,
  },
  listPaneWrapperClass: 'sp-mat-crud-list-pane-wrapper-class',
  previewPaneContentClass: 'sp-mat-crud-preview-pane-content-class',
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    SPMatEntityCrudComponent,
    CreateEditEntityDemoComponent,
    SPMatEntityCrudPreviewPaneComponent,
    PreviewInvoiceComponent,
  ],
  providers: [
    { provide: SP_MAT_ENTITY_CRUD_CONFIG, useValue: EntityCrudConfig },
  ],
  selector: 'app-entity-crud-demo',
  template: `
    <div style="width: 100%; height: 100%;">
      <sp-mat-entity-crud
        [entityLoaderFn]="invoicesLoaderFn"
        [columns]="invoiceColumns"
        [pageSize]="10"
        idKey="id"
        pagination="discrete"
        [paginator]="paginator"
        itemLabel="Invoice"
        itemsLabel="Invoices"
        (action)="onItemAction($event)"
        [crudOpFn]="crudOpFn"
        (selectEntity)="handleSelectEntity($event)"
        [previewTemplate]="userPreview"
        matSort
      >
      </sp-mat-entity-crud>
    </div>
    <ng-template #createEdit let-data>
      <app-create-edit-entity-demo
        [bridge]="data.bridge"
        [entity]="data.entity"
      ></app-create-edit-entity-demo>
    </ng-template>

    <ng-template #userPreview let-data>
      <sp-mat-entity-crud-preview-pane
        [entityCrudComponent]="spEntityCrudComponent()!"
      >
        <span previewToolbarContent>
          <button mat-icon-button title="Edit">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button title="Print">
            <mat-icon>print</mat-icon>
          </button>
        </span>

        <app-invoice-preview
          previewContent
          [invoice]="data.entity"
        ></app-invoice-preview>
      </sp-mat-entity-crud-preview-pane>
    </ng-template>
  `,
  styles: `
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityCrudDemoComponent implements OnInit {
  userEndpoint = 'https://randomuser.me/api/?nat=us,gb';
  userColumns: SPEntityFieldSpec<User>[] = [
    { name: 'name', label: 'NAME', valueFn: (user: User) => user.name.first },
    { name: 'gender', label: 'GENDER' },
    { name: 'cell', label: 'CELL' },
  ];

  invoicesLoaderFn = (params: any) =>
    of({ count: 2, next: null, previous: null, results: INVOICES });
  invoiceColumns: SPEntityFieldSpec<Invoice>[] = [
    { name: 'id' },
    { name: 'date' },
    { name: 'customer', valueFn: (item: Invoice) => item.customerDetail.name },
    { name: 'terms', valueOptions: { alignment: 'center' } },
    {
      name: 'balance',
      valueFn: (item: Invoice) => spFormatCurrency(item.balance) ?? '',
      valueOptions: { alignment: 'end' }
    },
  ];
  itemActions: SPContextMenuItem[] = [
    { label: 'Edit', role: '_update_' },
    {
      label: 'Delete',
      role: '_delete_',
      disable: (user: User) => user.cell.startsWith('('),
    },
  ];
  spEntityCrudComponent = viewChild(SPMatEntityCrudComponent);
  paginator = new MyPaginator();

  crudOpFn(
    op: string,
    entityValue: any,
    crudComponent: SPMatEntityCrudComponent<User, 'cell'>
  ) {
    if (op === 'create') {
      return of({
        name: {
          title: 'Mr',
          first: entityValue['firstName'],
          last: entityValue['lastName'],
        },
        gender: entityValue['gender'],
        cell: entityValue['cell'],
      } as unknown as User);
    } else if (op === 'update') {
      const ids = crudComponent
        ?.spEntitiesList()
        ?.store.query(getEntitiesIds());
      if (ids?.length) {
        const id = ids.find((id) => id === entityValue['cell']);
        // const id = ids[Math.floor((Math.random()*1000))%ids?.length];
        console.log(`Updating name & gender of cell # ${String(id)}`);
        return of({
          name: {
            title: 'Mr',
            first: entityValue['firstName'],
            last: entityValue['lastName'],
          },
          gender: entityValue['gender'],
          cell: id,
        });
      }
    }
    return of(null);
  }

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {}

  onItemAction(ev: { role: string; entity?: User }) {
    console.log(`onItemAction - role: ${ev.role}`);
    if (ev.role === 'edit') {
      if (ev.entity) {
        this.router.navigate([`${ev.entity['cell']}`], {
          relativeTo: this.route,
          state: {
            entity: ev.entity,
          },
        });
      }
    }
  }

  handleSelectEntity(user: User) {
    console.log(
      `handleSelectEntity - user: ${user ? user.name.first : undefined}`
    );
  }
}
