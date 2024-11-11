import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from "@angular/router";
import { getEntitiesIds } from '@ngneat/elf-entities';
import { SPContextMenuItem } from '@smallpearl/ngx-helper/mat-context-menu';
import { SP_MAT_ENTITY_CRUD_CONFIG, SPMatEntityCrudComponent, SPMatEntityCrudConfig } from '@smallpearl/ngx-helper/mat-entity-crud';
import { SPMatEntityListColumn } from '@smallpearl/ngx-helper/mat-entity-list';
import { of } from 'rxjs';
import { SPMatEntityCrudPreviewPaneComponent } from "../../../projects/smallpearl/ngx-helper/mat-entity-crud/src/preview-pane.component";
import { MyPaginator } from '../entity-list-demo/paginater';
import { User } from '../entity-list-demo/user';
import { CreateEditEntityDemoComponent } from "./create-edit-entity-demo.component";
import { SPEntityFieldSpec, StationaryWithLineItemsComponent } from '@smallpearl/ngx-helper/stationary-with-line-items';
import { spFormatCurrency } from '@smallpearl/ngx-helper/locale';
import { Invoice, INVOICES } from './data';
import { PreviewInvoiceComponent } from './preview-demo.component';

const EntityCrudConfig: SPMatEntityCrudConfig = {
  i18n: {
    newItemLabel: (itemLabel: string) => 'New USER',
    editItemLabel: (itemLabel: string) => 'Edit USER',
    edit: 'Update',
    delete: 'Remove',
    deleteItemHeader: (itemLabel: string) => `Delete ${itemLabel}?`,
    deleteItemMessage: (itemLabel: string) => `Are you sure you want to delete this ${itemLabel.toLocaleLowerCase()}?`,
    itemDeletedNotification: (itemLabel: string) => `${itemLabel} deleted.`,
    createdItemNotification: (itemLabel: string) => `${itemLabel} created.`,
    updatedItemNotification: (itemLabel: string) => `${itemLabel} updated.`,
  },
  listPaneWrapperClass: 'sp-mat-crud-list-pane-wrapper-class',
  previewPaneContentClass: 'sp-mat-crud-preview-pane-content-class'

}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    SPMatEntityCrudComponent,
    CreateEditEntityDemoComponent,
    SPMatEntityCrudPreviewPaneComponent,
    StationaryWithLineItemsComponent,
    PreviewInvoiceComponent,
  ],
  providers: [
    { provide: SP_MAT_ENTITY_CRUD_CONFIG, useValue: EntityCrudConfig },
  ],
  selector: 'app-entity-crud-demo',
  template: `
    <div style="width: 100%; height: 100%;">
      <sp-mat-entity-crud
        [entityLoaderFn]="entityLoaderFn"
        [endpoint]="endpoint"
        [columns]="invoiceColumns"
        [pageSize]="40"
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
        <!-- <ng-container matColumnDef="name">
          <th mat-header-cell mat-sort-header *matHeaderCellDef>FULL NAME</th>
          <td mat-cell *matCellDef="let element">
            {{ element.name.title }}. {{ element.name.first }}
            {{ element.name.last }}
          </td>
        </ng-container> -->
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
        [title]="data.entity.number"
        [entityCrudComponent]="spEntityCrudComponent()!"
      >
        <app-invoice-preview previewContent [invoice]="data.entity"></app-invoice-preview>
      </sp-mat-entity-crud-preview-pane>
    </ng-template>
  `,
  styles: `
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityCrudDemoComponent implements OnInit {
  entityLoaderFn = (params: any) =>
    of({ count: 2, next: null, previous: null, results: INVOICES });
  endpoint = 'https://randomuser.me/api/?nat=us,gb';
  columns: SPMatEntityListColumn<User>[] = [
    { name: 'name', label: 'NAME', valueFn: (user: User) => user.name.first },
    { name: 'gender', label: 'GENDER' },
    { name: 'cell', label: 'CELL' },
  ];

  invoiceColumns: SPMatEntityListColumn<Invoice>[] = [
    { name: 'id' },
    { name: 'date' },
    { name: 'customer', valueFn: (item: Invoice) => item.customerDetail.name },
    { name: 'terms' },
    {
      name: 'balance',
      valueFn: (item: Invoice) => spFormatCurrency(item.balance) ?? '',
    },
  ];
  invoicePreviewLeftHeader = (invoice: Invoice) => invoice.customerDetail.name;
  invoicePreviewRightHeaderFields: SPEntityFieldSpec<Invoice>[] = [
    { name: 'date' },
    { name: 'terms' },
    {
      name: 'balance',
      valueFn: (item: Invoice) => spFormatCurrency(item.balance) ?? '',
    },
  ];
  invoicePreviewItemColumns: SPEntityFieldSpec<Invoice>[] = [
    {
      name: 'product',
      valueFn: (lineItem: any) => lineItem.productDetail.name,
    },
    { name: 'quantity' },
    { name: 'unitPrice' },
    {
      name: 'total',
      valueFn: (lineItem: any) => spFormatCurrency(lineItem.quantity * lineItem.unitPrice) ?? '',
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

  rightHeaderFields: SPEntityFieldSpec<User>[] = [
    { name: 'name', label: 'NAME', valueFn: (user: User) => user.name.first },
    { name: 'gender', label: 'GENDER' },
    { name: 'cell', label: 'CELL' },
  ];
  rightFooterFields: SPEntityFieldSpec<Invoice>[] = [
    {
      name: 'total',
      label: 'TOTAL',
      valueFn: (invoice: Invoice) => {
        let total = 0;
        invoice.items.forEach(
          (item) => (total += item.unitPrice * item.quantity)
        );
        return spFormatCurrency(total) ?? '';
      },
    },
  ];
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

  getItems(entity: Invoice) {
    return entity.items;
    // return [
    //   {
    //     product: 'Management Fee',
    //     quantity: '21',
    //     unitPrice: '100',
    //     total: '2100',
    //   },
    //   {
    //     product: 'Carpark Fee',
    //     quantity: '1',
    //     unitPrice: '900',
    //     total: '900',
    //   },
    //   {
    //     product: 'Garbage Fee',
    //     quantity: '1',
    //     unitPrice: '300',
    //     total: '300',
    //   },
    // ];
  }
}
