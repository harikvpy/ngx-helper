import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, viewChild } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from "@angular/router";
import { getEntitiesIds } from '@ngneat/elf-entities';
import { SPContextMenuItem } from '@smallpearl/ngx-helper/mat-context-menu';
import { SPMatEntityCrudComponent } from '@smallpearl/ngx-helper/mat-entity-crud';
import { SPMatEntityListColumn } from '@smallpearl/ngx-helper/mat-entity-list';
import { of } from 'rxjs';
import { MyPaginator } from '../entity-list-demo/paginater';
import { User } from '../entity-list-demo/user';
import { CreateEditEntityDemoComponent } from "./create-edit-entity-demo.component";
import { SPMatEntityCrudPreviewPaneComponent } from "../../../projects/smallpearl/ngx-helper/mat-entity-crud/src/preview-pane.component";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    SPMatEntityCrudComponent,
    CreateEditEntityDemoComponent,
    SPMatEntityCrudPreviewPaneComponent
],
  selector: 'app-entity-crud-demo',
  template: `
  <div style="width: 100%; height: 100%;">
    <sp-mat-entity-crud
      [endpoint]="endpoint"
      [columns]="columns"
      [pageSize]="40"
      idKey="cell"
      pagination="discrete"
      [paginator]="paginator"
      itemLabel="User"
      itemsLabel="Users"
      [itemActions]="itemActions"
      (action)="onItemAction($event)"
      [createEditFormTemplate]="createEdit"
      [crudOpFn]="crudOpFn"
      (selectEntity)="handleSelectEntity($event)"
      [previewTemplate]="userPreview"
    >
    </sp-mat-entity-crud>
  </div>
  <ng-template #createEdit let-data>
    <app-create-edit-entity-demo [bridge]="data.bridge" [entity]="data.entity"></app-create-edit-entity-demo>
  </ng-template>

  <ng-template #userPreview let-data>
    <sp-mat-entity-crud-preview-pane
      [title]="data.entity.name.first + ' ' + data.entity.name.last"
      [entityCrudComponent]="spEntityCrudComponent()!"
    >
      <p>{{ data.entity.name.first }} {{ data.entity.name.first }}</p>
    </sp-mat-entity-crud-preview-pane>
  </ng-template>

  `,
  styles: `
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
    { label: 'Edit', role: '_update_', },
    { label: 'Delete', role: '_delete_', disable: (user: User) => user.cell.startsWith('(') }
  ];
  spEntityCrudComponent = viewChild(SPMatEntityCrudComponent);

  paginator = new MyPaginator();

  crudOpFn(op: string, entityValue: any, crudComponent: SPMatEntityCrudComponent<User, 'cell'>) {
    if (op === 'create') {
      return of(({
        name: { title: 'Mr', first: entityValue['firstName'], last: entityValue['lastName'] },
        gender: entityValue['gender'],
        cell: entityValue['cell']
      } as unknown) as User);
    } else if (op === 'update') {
      const ids = crudComponent?.spEntitiesList()?.store.query(getEntitiesIds());
      if (ids?.length) {
        const id = ids.find(id => id === entityValue['cell']);
        // const id = ids[Math.floor((Math.random()*1000))%ids?.length];
        console.log(`Updating name & gender of cell # ${String(id)}`);
        return of({
          name: { title: 'Mr', first: entityValue['firstName'], last: entityValue['lastName'] },
          gender: entityValue['gender'],
          cell: id
        });
      }
    }
    return of(null);
  }

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() { }

  onItemAction(ev: {role: string, entity?: User}) {
    console.log(`onItemAction - role: ${ev.role}`);
    if (ev.role === 'edit') {
      if (ev.entity) {
        this.router.navigate([`${ev.entity['cell']}`], {
          relativeTo: this.route,
          state: {
            entity: ev.entity
          }
        });
      }
    }
  }

  handleSelectEntity(user: User) {
    console.log(`handleSelectEntity - user: ${user ? user.name.first : undefined}`);
  }
}
