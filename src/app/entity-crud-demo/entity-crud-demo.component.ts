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
  NewItemSubType,
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { SPMatEntityCrudCanDeactivate } from './can-deactivate';

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
    loseChangesPrompt: 'Are you okay with loosing changes?',
  },
  listPaneWrapperClass: 'sp-mat-crud-list-pane-wrapper-class',
  previewPaneWrapperClass: 'sp-mat-crud-preview-pane-wrapper-class',
};

@Component({
    imports: [
        CommonModule,
        FormsModule,
        MatTableModule,
        MatSortModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatButtonModule,
        MatTabsModule,
        MatMenuModule,
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
      <mat-tab-group style="width: 100%; height: 100%;">

        <!-- Simple Standard crud view -->
        <mat-tab label="Simple">
          <sp-mat-entity-crud
            #spEntityCrud1
            entityName="invoice"
            [entityLoaderFn]="invoicesLoaderFn"
            [columns]="invoiceColumns"
            [pageSize]="10"
            idKey="id"
            pagination="discrete"
            [paginator]="paginator"
            itemLabel="Invoice"
            itemsLabel="Invoices"
            newItemLabel="NEW INVOICE"
            editItemTitle="EDIT INVOICE"
            (action)="onItemAction($event)"
            [crudOpFn]="crudOpFn"
            (selectEntity)="handleSelectEntity($event)"
            [createEditFormTemplate]="createEdit"
            [previewTemplate]="userPreview1"
            [editPaneWidth]="60"
          >
          </sp-mat-entity-crud>

          <ng-template #userPreview1 let-data>
            <sp-mat-entity-crud-preview-pane
              [entity]="data.entity"
              [entityCrudComponent]="spEntityCrudComponent1()!"
              [hideUpdate]="true"
              [disableDelete]="true"
            >
              <span previewToolbarContent>
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

        </mat-tab>

        <!-- With newItemSubTypes showing a dropdown menu -->
        <mat-tab label="Item SubTypes">
          <sp-mat-entity-crud
            #spEntityCrud2
            entityName="invoice"
            [entityLoaderFn]="invoicesLoaderFn"
            [columns]="invoiceColumns"
            [pageSize]="10"
            [newItemSubTypes]="newSubTypes"
            idKey="id"
            pagination="discrete"
            [paginator]="paginator"
            itemLabel="Invoice"
            itemsLabel="Invoices"
            (action)="onItemAction($event)"
            [crudOpFn]="crudOpFn"
            (selectEntity)="handleSelectEntity($event)"
            [createEditFormTemplate]="createEdit"
            [previewTemplate]="userPreview2"
            matSort
          >
          </sp-mat-entity-crud>
          <ng-template #userPreview2 let-data>
            <sp-mat-entity-crud-preview-pane
              [entity]="data.entity"
              [entityCrudComponent]="spEntityCrudComponent2()!"
              [hideUpdate]="true"
              [disableDelete]="true"
            >
              <span previewToolbarContent>
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
        </mat-tab>

        <!-- Customer header via template -->
        <mat-tab label="Override Header">
          <sp-mat-entity-crud
            #spEntityCrud3
            entityName="invoice"
            [entityLoaderFn]="invoicesLoaderFn"
            [columns]="invoiceColumns"
            [pageSize]="10"
            idKey="id"
            pagination="discrete"
            [paginator]="paginator"
            itemLabel="Invoice"
            itemsLabel="Invoices"
            title="Outstanding Invoices"
            (action)="onItemAction($event)"
            [crudOpFn]="crudOpFn"
            (selectEntity)="handleSelectEntity($event)"
            [createEditFormTemplate]="createEdit"
            [previewTemplate]="userPreview3"
            [headerTemplate]="customHeader"
            matSort
          >
            <div breadCrumbs>this is breadcrumb!</div>
          </sp-mat-entity-crud>
          <ng-template #customHeader>
            <div class='header'>
              <h2>CUSTOM HEADER</h2>
              <div class="spacer"></div>
              <div class="action-buttons">
                <button mat-raised-button color="primary">New Invoice</button>
                <button mat-raised-button color="primary">Import</button>
                <button mat-raised-button color="primary" [matMenuTriggerFor]="moreItems">More</button>
              </div>
            </div>
            <mat-menu #moreItems="matMenu">
              <button mat-menu-item>Item 1</button>
              <button mat-menu-item>Item 2</button>
              <button mat-menu-item>Item 3</button>
              <button mat-menu-item>Item 4</button>
            </mat-menu>
          </ng-template>

          <ng-template #userPreview3 let-data>
            <sp-mat-entity-crud-preview-pane
              [entity]="data.entity"
              [entityCrudComponent]="spEntityCrudComponent3()!"
              [hideUpdate]="true"
              [disableDelete]="true"
            >
              <span previewToolbarContent>
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
        </mat-tab>

        <!-- Header with custom action buttons -->
        <mat-tab label="Override Action Buttons">
          <sp-mat-entity-crud
            #spEntityCrud4
            entityName="invoice"
            [entityLoaderFn]="invoicesLoaderFn"
            [columns]="invoiceColumns"
            [pageSize]="10"
            idKey="id"
            pagination="discrete"
            [paginator]="paginator"
            itemLabel="Invoice"
            itemsLabel="Invoices"
            title="All Invoices"
            (action)="onItemAction($event)"
            [crudOpFn]="crudOpFn"
            (selectEntity)="handleSelectEntity($event)"
            [createEditFormTemplate]="createEdit"
            [previewTemplate]="userPreview4"
            [actionsTemplate]="actionButtons"
            [itemActions]="itemActions"
            matSort
          >
          </sp-mat-entity-crud>
          <ng-template #actionButtons>
            <button mat-raised-button color="primary" [matMenuTriggerFor]="moreActions">
              More
              <mat-icon>expand_circle_down</mat-icon>
            </button>
            <mat-menu #moreActions="matMenu">
              <button mat-menu-item>Item 1</button>
              <button mat-menu-item>Item 2</button>
              <button mat-menu-item>Item 3</button>
              <button mat-menu-item>Item 4</button>
            </mat-menu>
          </ng-template>

          <ng-template #userPreview4 let-data>
            <sp-mat-entity-crud-preview-pane
              [entity]="data.entity"
              [entityCrudComponent]="spEntityCrudComponent4()!"
              [hideUpdate]="true"
              [disableDelete]="true"
            >
              <span previewToolbarContent>
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
        </mat-tab>

      </mat-tab-group>
    </div>

    <ng-template #createEdit let-data>
      <app-create-edit-entity-demo
        [bridge]="data.bridge"
        [entity]="data.entity"
        [params]="data.params"
      ></app-create-edit-entity-demo>
    </ng-template>
  `,
    styles: `
  .header {
    display: flex;
    flex-direction: row;
  }
  .spacer {
    flex-grow: 1;
  }
  .action-buttons {
    display: flex;
    flex-direction: row;
    gap: 0.2em;
  }
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityCrudDemoComponent implements OnInit, SPMatEntityCrudCanDeactivate {
  userEndpoint = 'https://randomuser.me/api/?nat=us,gb';
  userColumns: SPEntityFieldSpec<User>[] = [
    { name: 'name', label: 'NAME', valueFn: (user: User) => user.name.first },
    { name: 'gender', label: 'GENDER' },
    { name: 'cell', label: 'CELL' },
  ];

  invoicesLoaderFn = (params: any) => {
    const localInvoices = [];
    for (let index = 0; index < 50; index++) {
      const copy = JSON.parse(JSON.stringify(INVOICES));
      copy[0].id = 1000+index*2;
      copy[1].id = 1000+index*2+1;
      localInvoices.push(copy[0]);
      localInvoices.push(copy[1]);
    }
    return of({ count: 100, next: null, previous: null, results: localInvoices });
  }
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
    { label: 'INCOME', role: ''},
      { label: 'Edit', role: '_update_' },
      { label: 'Remove', role: '_delete_' },
    { label: 'EXPENSE', role: ''},
      { label: 'Bill Payment', role: 'billPayment' },
      {
        label: 'Advance to Owner',
        role: 'advanceToOwner',
        disable: (item: Invoice) => {
          return item.customerDetail.name.startsWith('Peter')
        }
      },
  ];
  spEntityCrudComponent1 = viewChild('spEntityCrud1', {read: SPMatEntityCrudComponent});
  spEntityCrudComponent2 = viewChild('spEntityCrud2', {read: SPMatEntityCrudComponent});
  spEntityCrudComponent3 = viewChild('spEntityCrud3', {read: SPMatEntityCrudComponent});
  spEntityCrudComponent4 = viewChild('spEntityCrud4', {read: SPMatEntityCrudComponent});

  paginator = new MyPaginator();
  newSubTypes: NewItemSubType[] = [
    {
      role: '',
      label: 'INCOME'
    },
    {
      role: '_new_',
      label: 'Customer Payment',
      params: {
        type: 'customer_payment'
      }
    },
    {
      role: '_new_',
      label: 'Customer Advance',
      params: {
        type: 'customer_advance'
      }
    },
    {
      role: '',
      label: 'EXPENSE'
    },
    {
      role: '_new_',
      label: 'Bill Payment',
      params: {
        type: 'bill_payment'
      }
    },
  ]
  crudOpFn(
    op: string,
    entityValue: any,
    crudComponent: SPMatEntityCrudComponent<Invoice, 'id'>
  ) {
    if (op === 'create') {
      return of({
        name: {
          id: new Date().getTime(),
          number: new Date().getTime(),
          date: new Date(),
          customer: 1,
          customerDetail: {
            id: 1,
            name: 'John'
          },
          items: [],
          balance: 0,
        },
      } as unknown as Invoice);
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
            id: new Date().getTime(),
            number: new Date().getTime(),
            date: new Date(),
            customer: 1,
            customerDetail: {
              id: 1,
              name: 'John'
            },
            items: [],
            balance: 0,
          },
        } as unknown as Invoice);      }
    }
    return of(null);
  }

  constructor(private router: Router, private route: ActivatedRoute) {}

  canDeactivate(): boolean {
    return !!this.spEntityCrudComponent1()?.canDeactivate();
  }

  ngOnInit() {}

  onItemAction(ev: { role: string; entity?: Invoice } | undefined) {
    console.log(`onItemAction - role: ${ev?.role}`);
    if (ev?.role === 'edit') {
      if (ev?.entity) {
        this.router.navigate([`${ev?.entity['number']}`], {
          relativeTo: this.route,
          state: {
            entity: ev?.entity,
          },
        });
      }
    }
  }

  handleSelectEntity(invoice: Invoice | undefined) {
    console.log(
      `handleSelectEntity - user: ${invoice ? invoice : undefined}`
    );
  }
}
