import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SPMatEntityCrudComponent } from '@smallpearl/ngx-helper/mat-entity-crud';
import { SPMatEntityListColumn } from '@smallpearl/ngx-helper/mat-entity-list';
import { MyPaginator } from '../entity-list-demo/paginater';
import { User } from '../entity-list-demo/user';
import { SPContextMenuItem } from '@smallpearl/ngx-helper/mat-context-menu';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    SPMatEntityCrudComponent,
  ],
  selector: 'app-entity-crud-demo',
  template: `
  <div class="p-2" style="height: 100%; overflow: scroll;">
    <sp-mat-entity-crud
      [endpoint]="endpoint"
      [columns]="columns"
      [pageSize]="40"
      idKey="cell"
      pagination="discrete"
      [paginator]="paginator"
      [disableSort]="true"
      itemLabel="User"
      itemsLabel="Users"
      [itemActions]="itemActions"
    >
    </sp-mat-entity-crud>
  </div>
  `,
  styles: `
  .p-2 {
    padding: 0.5em;
  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class EntityCrudDemoComponent implements OnInit {
  endpoint = 'https://randomuser.me/api/?nat=us,gb';
  columns: SPMatEntityListColumn<User>[] = [
    { name: 'name', label: 'NAME', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
    { name: 'gender', label: 'GENDER' },
    { name: 'cell', label: 'CELL' },
    { name: 'action', label: 'ACTION' },
  ];
  itemActions: SPContextMenuItem[] = [
    { label: 'Edit', role: 'edit', },
    { label: 'Delete', role: 'delete', disable: (user: User) => user.cell.startsWith('(') }
  ];

  paginator = new MyPaginator();

  constructor() { }

  ngOnInit() { }
}
