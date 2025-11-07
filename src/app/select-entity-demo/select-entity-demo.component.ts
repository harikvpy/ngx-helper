import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SPMatSelectEntityComponent } from '@smallpearl/ngx-helper/mat-select-entity';
import { of, tap } from 'rxjs';

/**
 */
interface User {
  id: number;
  name: string;
}

const USER_DATA = [
  { id: 1, name: 'Mariam Trevarthen' },
  { id: 2, name: 'Lanny Nathanson' },
  { id: 3, name: 'Jaye Nevin' },
  { id: 4, name: 'Cordelia Blauser' },
  { id: 5, name: 'Talisha Houk' },
  { id: 6, name: 'Kirsten Jerkins' },
  { id: 7, name: 'Kandace Oleary' },
  { id: 8, name: 'Tammara Michell' },
  { id: 9, name: 'Lily Rainwater' },
  { id: 10, name: 'Izola Silversmith' },
];

interface Block {
  id: number;
  name: string;
  units: Unit[];
}

interface Unit {
  id: number;
  name: string;
}

const BLOCKS: Block[] = [
  {
    id: 1000,
    name: 'East',
    units: [
      {
        id: 1000,
        name: '2A',
      },
      {
        id: 1001,
        name: '2B',
      },
      {
        id: 1002,
        name: '2C',
      },
      {
        id: 1003,
        name: '3A',
      },
      {
        id: 1004,
        name: '3B',
      },
      {
        id: 1005,
        name: '3C',
      },
      {
        id: 1006,
        name: '4A',
      },
      {
        id: 1007,
        name: '4B',
      },
      {
        id: 1008,
        name: '4C',
      },
      {
        id: 1009,
        name: '5A',
      },
      {
        id: 1010,
        name: '5B',
      },
      {
        id: 1011,
        name: '5C',
      },
    ],
  },
  {
    id: 1001,
    name: 'West',
    units: [
      {
        id: 2000,
        name: '2A',
      },
      {
        id: 2001,
        name: '2B',
      },
      {
        id: 2002,
        name: '2C',
      },
      {
        id: 2003,
        name: '3A',
      },
      {
        id: 2004,
        name: '3B',
      },
      {
        id: 2005,
        name: '3C',
      },
      {
        id: 2006,
        name: '4A',
      },
      {
        id: 2007,
        name: '4B',
      },
      {
        id: 2008,
        name: '4C',
      },
    ],
  },
];

@Component({
    selector: 'app-select-entity-demo',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        SPMatSelectEntityComponent,
    ],
    template: `
  <div class="select-entity-demo-wrapper">
    <div class="select-entity-demo-scroller">
      <div class="select-entity-demo-container">
        <div class="select-entity-demo-row-1">
          <div class="fs-2">Select Entity Demo</div>
          <div class="">
            <form [formGroup]="form">
              <div class="p-2">
                <mat-form-field>
                  <mat-label>Select User with 'Add User'</mat-label>
                  <sp-mat-select-entity
                    [loadFromRemoteFn]="loadUsers"
                    entityName="User"
                    [entityLabelFn]="userLabelFn"
                    formControlName="user"
                    (selectionChange)="onUserSelected($event)"
                    (createNewItemSelected)="onCreateNewUser($event)"
                    [inlineNew]="true"
                  ></sp-mat-select-entity>
                </mat-form-field>
              </div>
              <div class="p-2">
                <mat-form-field>
                  <mat-label>Select Unit (grouping)</mat-label>
                  <sp-mat-select-entity
                    [loadFromRemoteFn]="loadUnits"
                    entityName="Unit"
                    [entityLabelFn]="unitLabelFn"
                    [group]="true"
                    [groupLabelFn]="blockLabelFn"
                    formControlName="unit"
                    (selectionChange)="onUnitSelected($event)"
                  ></sp-mat-select-entity>
                </mat-form-field>
              </div>
              <div class="p-2">
                <mat-form-field>
                  <mat-label>Select User1 (Remote)</mat-label>
                  <sp-mat-select-entity
                    [url]="remoteUsersUrl"
                    [entityLabelFn]="remoteUserLabelFn"
                    entityName="Remote User 1"
                    formControlName="remoteUser1"
                    (selectionChange)="onRemoteUserSelected1($event)"
                  ></sp-mat-select-entity>
                </mat-form-field>
              </div>
              <div class="p-2">
                <mat-form-field>
                  <mat-label>Select User2 (Remote)</mat-label>
                  <sp-mat-select-entity
                    idKey="cell"
                    [url]="remoteUsersUrl"
                    [entityLabelFn]="remoteUserLabelFn"
                    entityName="user"
                    formControlName="remoteUser2"
                    (selectionChange)="onRemoteUserSelected2($event)"
                  ></sp-mat-select-entity>
                </mat-form-field>
              </div>


              <div class="p-2">
                <mat-form-field>
                  <mat-label>Custom Template</mat-label>
                  <sp-mat-select-entity
                    idKey="cell"
                    [url]="remoteUsersUrl"
                    [entityLabelFn]="remoteUserLabelFn"
                    entityName="user"
                    formControlName="remoteUser3"
                    (selectionChange)="onRemoteUserSelected3($event)"
                    [optionLabelTemplate]="myOptionLabelTemplate"
                  ></sp-mat-select-entity>

                </mat-form-field>

                <ng-template #myOptionLabelTemplate let-entity>
                  <span class="option-label">
                    <img [src]="entity.picture.thumbnail" width="28" height="28" alt="Image">&nbsp;
                    {{ entity.name.title + '。' + entity.name.first + '-' + entity.name.last }}
                  </span>
                </ng-template>

              </div>
            </form>
          </div>
        </div>
        <div class="select-entity-demo-row-2">

        </div>
        <div class="select-entity-demo-row-3"></div>
      </div>
    </div>
  </div>
  `,
    styles: [`
  .fs-2 {
    font-size: 2em;
  }
  .select-entity-demo-wrapper {
    display: flex;
    flex-flow: column;
    height: 100%;
  }
  .select-entity-demo-scroller {
    overflow-y: auto;
  }
  .select-entity-demo-container {
    height: 1500px;
  }
  .select-entity-demo-row-1 {
    height: 500px;
  }
  .select-entity-demo-row-2 {
    height: 500px;
  }
  .select-entity-demo-row-3 {
    height: 500px;
  }
  .h2 {
    font-size: 1.3em;
    font-weight: 800;
  }
  .option-label {
    text-overflow: ellipsis;
    text-wrap: nowrap;
  }
  .option-label img {
    border-radius: 50%;
  }
  `,
    ]
})
export class SelectEntityDemoComponent {
  loadUsers = () => of(USER_DATA);
  loadUnits = () => of(BLOCKS);
  userLabelFn = (u: User) => u.name;
  blockLabelFn = (u: Block) => u.name;
  unitLabelFn = (u: Unit) => u.name;
  entities = USER_DATA;
  form!: FormGroup;
  @ViewChild(SPMatSelectEntityComponent)
  selectEntityCtrl!: SPMatSelectEntityComponent<User>;

  remoteUsersUrl = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
  remoteUserLabelFn = (user: any) => `${user.name.title}. ${user.name.first} ${user.name.last}`;

  constructor(private fb: FormBuilder, private host: ElementRef) {
    this.form = this.fb.group({
      user: [undefined, Validators.required],
      remoteUser1: [undefined],
      remoteUser2: [undefined],
      remoteUser3: [undefined],
      unit: [undefined],
    });
    this.form.valueChanges
      .pipe(
        tap((values) => {
          console.log(`Form values: ${JSON.stringify(values)}`);
        })
      )
      .subscribe();

    // setTimeout(() => {
    //   if (this.selectEntityCtrl) {
    //     const DET_MOOSA = {id: 100000, name: "Moosa Marikkar"};
    //     console.log('Adding new user after 2 secs:', DET_MOOSA.name);
    //     this.selectEntityCtrl.addEntity(DET_MOOSA);
    //     this.form.controls['user'].setValue([DET_MOOSA.id]);
    //   } else {
    //     console.log('selectEntityCtrl is not resolved.');
    //   }
    // }, 2000);

    // setTimeout(() => {
    //   console.log('Disabling mat-select-entity');
    //   this.form.controls['user'].disable();
    // }, 3000);
  }

  onUserSelected(ev: User | User[]) {
    console.log(`onUserSelected - ev: ${JSON.stringify(ev)}`);
  }

  onRemoteUserSelected1(ev: any) {
    console.log(`onRemoteUserSelected1 - ev: ${JSON.stringify(ev)}`);
  }

  onRemoteUserSelected2(ev: any) {
    console.log(`onRemoteUserSelected2 - ev: ${JSON.stringify(ev.cell)}`);
  }

  onRemoteUserSelected3(ev: any) {
    console.log(`onRemoteUserSelected3 - ev: ${JSON.stringify(ev)}`);
  }

  onCreateNewUser(ev: any) {
    console.log(`onCreateNewUser - ev: ${JSON.stringify(ev)}`);
  }

  onUnitSelected(ev: User | User[]) {
    console.log(`onUnitSelected - ev: ${JSON.stringify(ev)}`);
  }

  onCreateNewUnit(ev: any) {
    console.log(`onCreateNewUnit - ev: ${JSON.stringify(ev)}`);
  }

  onScrollDown() {
    console.log(`onScrollDown`);
  }

  onScrollUp() {
    console.log(`onScrollUp`);
  }
}
