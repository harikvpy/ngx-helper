import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SPContextMenuItem } from '@smallpearl/ngx-helper/mat-context-menu';
import { SPMatEntityCrudComponent } from '@smallpearl/ngx-helper/mat-entity-crud';
import { SPMatEntityListColumn } from '@smallpearl/ngx-helper/mat-entity-list';
import { finalize, Observable, tap } from 'rxjs';
import { MyPaginator } from '../entity-list-demo/paginater';
import { User } from '../entity-list-demo/user';

export function trackBusyWheelStatus(id?: string, show = true, showImmediate = false, hideOnNthEmit = 0) {
  let timeout: any = null;
  let wheelShown = false;
  if (show) {
    timeout = setTimeout(
      () => {
        // showBusyWheel(id);
        wheelShown = true;
      },
      showImmediate ? 0 : 150
    );
  }

  return function <T>(source: Observable<T>): Observable<T> {
    let emits = 0;
    const hideFn = () => {
      // console.log('busywheel.hideFn');
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (!show || wheelShown) {
        // hideBusyWheel(id);
      }
    };
    return source.pipe(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tap((val) => {
        if (hideOnNthEmit > 0 && ++emits == hideOnNthEmit) {
          // console.log(`trackBusyWheelStatus - obs emitted ${hideOnNthEmit} values, hiding`);
          hideFn();
        }
      }),
      finalize(() => {
        // finalize() arg will be invoked upon completion or error
        hideFn();
      })
    );
  };
}

export function showBusyWheelUntilComplete(id?: string, showImmediate = false) {
  return trackBusyWheelStatus(id, true, showImmediate, 0);
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    SPMatEntityCrudComponent,
  ],
  selector: 'app-entity-crud-demo',
  template: `
  <div>
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
      (action)="onItemAction($event)"
      [newItemLink]="['./new']"
    >
    </sp-mat-entity-crud>
  </div>
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
    { label: 'Edit', role: 'edit', },
    { label: 'Delete', role: 'delete', disable: (user: User) => user.cell.startsWith('(') }
  ];

  paginator = new MyPaginator();

  private overlayRef!: OverlayRef;
  isOpen = signal<boolean>(false);

  constructor(private overlay: Overlay) { }

  ngOnInit() { }

  onItemAction(ev: {role: string, entity?: User}) {
    console.log(`onItemAction - role: ${ev.role}`);
    if (ev.role === '_new_') {
      this.isOpen.set(true);
      setTimeout(() => {
        this.isOpen.set(false);
      }, 5000);
    }
  }
}
