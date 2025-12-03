import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SPEntityListPaginator, SPPageParams } from '@smallpearl/ngx-helper/entities';
import { SPMatSelectEntityComponent } from '@smallpearl/ngx-helper/mat-select-entity';
import { of, tap } from 'rxjs';
import { USER_DATA } from './user-data';

/**
 */
interface User {
  id: number;
  name: {
    title: string;
    first: string;
    last: string;
  };
  phone: string;
}

interface Unit {
  id: number;
  name: string;
  block: number;
  blockName: string;
}

const UNITS: Unit[] = [
  {
    id: 1000,
    name: '2A',
    block: 1000,
    blockName: 'East',
  },
  {
    id: 1001,
    name: '2B',
    block: 1000,
    blockName: 'East',
  },
  {
    id: 1002,
    name: '2C',
    block: 1000,
    blockName: 'East',
  },
  {
    id: 2000,
    name: '2A',
    block: 1001,
    blockName: 'West',
  },
  {
    id: 2001,
    name: '2B',
    block: 1001,
    blockName: 'West',
  },
  {
    id: 2002,
    name: '2C',
    block: 1001,
    blockName: 'West',
  },
];

interface RandomUser {
  gender: string;
  name: {
    title: string;
    first: string;
    last: string;
  };
  location: any;
  email: string;
  login: any;
  dob: any;
  registered: any;
  phone: string;
  cell: string;
  id: any;
  picture: any;
  nat: string;
}

class RandomUserResponsePaginator implements SPEntityListPaginator {

   /**
   * Random user API request pagination params are:
   * - page: page number (starting from 1)
   * - results: number of results per page
   */
    getRequestPageParams(endpoint: string, pageIndex: number, pageSize: number): SPPageParams {
        return {
          page: pageIndex + 1,
          results: pageSize,
        };
    }

    /**
     * Random user API response looks like:
     * {
     *   "results": [ ... ],
     *   "info": {
     *     "seed": "abc",
     *     "results": 10,
     *     "page": 1,
     *     "version": "1.3"
     *   }
     * }
     */
    parseRequestResponse<
      TEntity extends { [P in IdKey]: PropertyKey },
      IdKey extends string = 'id'
    >(
      entityName: string,
      entityNamePlural: string,
      endpoint: string,
      params: SPPageParams,
      resp: any
    ) {
      return {
        total: resp.info.results * 3,
        entities: resp.results,
      };
    };
}

const serveUserData = (
  pageIndex: number,
  pageSize: number,
  searchValue: string | undefined
) => {
  pageIndex = pageIndex;
  console.log(
    `serveUserData - pageIndex: ${pageIndex}, pageSize: ${pageSize}, searchValue: ${searchValue}`
  );
  let filteredData = USER_DATA;
  if (searchValue && searchValue.length > 0) {
    const svLower = searchValue.toLowerCase();
    filteredData = USER_DATA.filter(
      (u) =>
        u.name.first.toLowerCase().indexOf(svLower) >= 0 ||
        u.name.last.toLowerCase().indexOf(svLower) >= 0
    );
  }
  const startIndex = pageIndex * pageSize;
  return of({
    meta: {
      total: USER_DATA.length,
    },
    users: [...filteredData.slice(startIndex, startIndex + pageSize)]
  });
};

/**
 * A paginator that serves static USER_DATA with pagination and search
 * filtering.
 */
class StaticUserDataPaginator implements SPEntityListPaginator {
  getRequestPageParams(
    endpoint: string,
    pageIndex: number,
    pageSize: number
  ): SPPageParams {
    return {
      page: pageIndex + 1,
      results: pageSize,
    };
  }

  parseRequestResponse<
    TEntity extends { [P in IdKey]: PropertyKey },
    IdKey extends string = 'id'
  >(
    entityName: string,
    entityNamePlural: string,
    endpoint: string,
    params: SPPageParams,
    resp: any // TEntity[]
  ) {
    const searchStr = params?.['search'] as string;
    let totalUsers = USER_DATA.length;
    // If search string is provided, calculate totalUsers accordingly
    if (searchStr && searchStr.length > 0) {
      const svLower = searchStr.toLowerCase();
      const allUsers = USER_DATA.filter(
        (u) =>
          u.name.title.toLowerCase().indexOf(svLower) >= 0 ||
          u.name.first.toLowerCase().indexOf(svLower) >= 0 ||
          u.name.last.toLowerCase().indexOf(svLower) >= 0
      );
      totalUsers = allUsers.length;
    }
    // console.log(
    //   `StaticUserDataPaginator.parseRequestResponse - params: ${JSON.stringify(
    //     params
    //   )} resp.length: ${resp.length}, totalUsers: ${totalUsers}`
    // );
    return {
      total: resp['meta'].total,
      entities: resp['users'],
    };
  }
}

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
                    <mat-label>User (Add User)</mat-label>
                    <sp-mat-select-entity
                      [url]="loadUsers"
                      entityName="user"
                      [labelFn]="userLabelFn"
                      formControlName="user"
                      (selectionChange)="onUserSelected($event)"
                      (createNewItemSelected)="onCreateNewUser($event)"
                      [inlineNew]="true"
                    ></sp-mat-select-entity>
                  </mat-form-field>
                </div>

                <div class="p-2">
                  <mat-form-field>
                    <mat-label>Unit (Grouped)</mat-label>
                    <sp-mat-select-entity
                      [url]="loadUnits"
                      entityName="unit"
                      [labelFn]="unitLabelFn"
                      [groupByFn]="groupByFn"
                      formControlName="unit"
                      (selectionChange)="onUnitSelected($event)"
                    ></sp-mat-select-entity>
                  </mat-form-field>
                </div>
                <div class="p-2">
                  <mat-form-field>
                    <mat-label>User (Local)</mat-label>
                    <sp-mat-select-entity
                      [url]="remoteUsersFn"
                      entityName="user"
                      [entities]="initialEntities"
                      [labelFn]="remoteUserLabelFn"
                      [pageSize]="20"
                      idKey="phone"
                      formControlName="remoteUser1"
                      (selectionChange)="onRemoteUserSelected1($event)"
                      [paginator]="staticUserPaginator"
                    ></sp-mat-select-entity>
                  </mat-form-field>
                </div>
                <div class="p-2">
                  <mat-form-field>
                    <mat-label>User (Remote)</mat-label>
                    <sp-mat-select-entity
                      [url]="remoteUsersUrl"
                      entityName="user"
                      idKey="cell"
                      [labelFn]="remoteUserLabelFn"
                      formControlName="remoteUser2"
                      [paginator]="remoteUserPaginator"
                      (selectionChange)="onRemoteUserSelected2($event)"
                    ></sp-mat-select-entity>
                  </mat-form-field>
                </div>
                <div class="p-2">
                  <mat-form-field>
                    <mat-label>Empty Response</mat-label>
                    <sp-mat-select-entity
                      [url]="emptyResponseFn"
                      entityName="user"
                      idKey="cell"
                      [labelFn]="remoteUserLabelFn"
                      formControlName="remoteUser2"
                      [paginator]="remoteUserPaginator"
                      (selectionChange)="onRemoteUserSelected2($event)"
                    ></sp-mat-select-entity>
                  </mat-form-field>
                </div>

                <!-- -->

                <!-- <div class="p-2">
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
              </div> -->
              </form>
            </div>
          </div>
          <div class="select-entity-demo-row-2"></div>
          <div class="select-entity-demo-row-3"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
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
  ],
})
export class SelectEntityDemoComponent {
  loadUsers = () => of(USER_DATA);
  loadUnits = () => of(UNITS);
  userLabelFn = (u: User) =>
    u.name.title + ' ' + u.name.first + ' ' + u.name.last;
  unitLabelFn = (u: Unit) => u.name;
  entities = USER_DATA;
  initialEntities = [USER_DATA[0]];
  form!: FormGroup;
  @ViewChild(SPMatSelectEntityComponent)
  selectEntityCtrl!: SPMatSelectEntityComponent<User>;
  remoteUsersFn = serveUserData;
  groupByFn = (unit: Unit) => unit.blockName;
  emptyResponseFn = (
    pageIndex: number,
    pageSize: number,
    searchValue: string | undefined
  ) => of([]);

  pureRemoteUsersUrl = 'https://randomuser.me/api/?nat=us,dk,fr,gb';
  remoteUsersUrl = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
  remoteUserLabelFn = (user: any) =>
    `${user.name.title}. ${user.name.first} ${user.name.last}`;
  remoteUserPaginator = new RandomUserResponsePaginator();
  staticUserPaginator = new StaticUserDataPaginator();

  constructor(private fb: FormBuilder, private host: ElementRef) {
    this.form = this.fb.group({
      user: [undefined, Validators.required],
      remoteUser1: [USER_DATA[0].phone],
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

  onUnitSelected(ev: any) {
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
