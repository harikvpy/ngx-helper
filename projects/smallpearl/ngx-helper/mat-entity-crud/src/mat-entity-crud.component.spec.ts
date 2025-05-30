import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  Component,
  ComponentRef,
  computed,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { getEntitiesCount } from '@ngneat/elf-entities';
import { SPEntityFieldSpec } from '@smallpearl/ngx-helper/entity-field';
import { SPContextMenuItem } from '@smallpearl/ngx-helper/mat-context-menu';
import {
  SPMatEntityListComponent,
  SPMatEntityListPaginator,
} from '@smallpearl/ngx-helper/mat-entity-list';
import { getTranslocoModule } from '@smallpearl/ngx-helper/src/transloco-testing.module';
import { firstValueFrom, of, tap } from 'rxjs';
import {
  NewItemSubType,
  SP_MAT_ENTITY_CRUD_HTTP_CONTEXT,
  SPMatEntityCrudCreateEditBridge,
  SPMatEntityCrudHttpContext,
} from './mat-entity-crud-types';
import { SPMatEntityCrudComponent } from './mat-entity-crud.component';
import { SPMatEntityCrudPreviewPaneComponent } from './preview-pane.component';

interface User {
  name: { title: string; first: string; last: string };
  gender: string;
  cell: string;
}

const MOCK_USER: User = {
  name: { title: '', first: '', last: '' },
  gender: '',
  cell: '',
};

const USER_DATA: User[] = [
  {
    name: { title: 'Ms', first: 'Mariam', last: 'Trevarthen' },
    cell: '12323234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Lanny', last: 'Nathanson' },
    cell: '22323234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Jaye', last: 'Nevin' },
    cell: '32121234',
    gender: 'M',
  },
  {
    name: { title: 'Ms', first: 'Cordelia', last: 'Blauser' },
    cell: '42323234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Talisha', last: 'Houk' },
    cell: '52323234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Kirsten', last: 'Jerkins' },
    cell: '63333234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Kandace', last: 'Oleary' },
    cell: '72525234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Tammara', last: 'Michell' },
    cell: '82929234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Lily', last: 'Rainwater' },
    cell: '92121234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Izola', last: 'Silversmith' },
    cell: '99343234',
    gender: 'F',
  },
];

const USER_COLUMNS: SPEntityFieldSpec<User, 'cell'>[] = [
  {
    name: 'name',
    valueFn: (user: User) => user.name.first + ' ' + user.name.last,
  },
  { name: 'gender' },
  { name: 'cell' },
  // { name: 'action', label: 'ACTION' },
];

type UserEntityCrudComponent = SPMatEntityCrudComponent<User, 'cell'>;

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  selector: 'create-edit-user-demo',
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="onNgSubmit()"
      class="d-flex flex-column align-items-start"
      errorTailor
    >
      <div class="d-flex flex-row gap-1">
        <mat-form-field>
          <mat-label>Firstname</mat-label>
          <input matInput formControlName="first" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Lastname</mat-label>
          <input matInput formControlName="last" />
        </mat-form-field>
      </div>
      <mat-form-field>
        <mat-label>Gender</mat-label>
        <mat-select formControlName="gender">
          <mat-option value="male">Male</mat-option>
          <mat-option value="female">Female</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Cell</mat-label>
        <input matInput formControlName="cell" />
      </mat-form-field>

      <div class="mt-2 d-flex gap-2">
        <button
          type="button"
          color="secondary"
          mat-raised-button
          (click)="form.reset()"
        >
          Reset
        </button>
        <button
          type="submit"
          color="primary"
          mat-raised-button
          [disabled]="form.invalid"
        >
          Save
        </button>
      </div>
    </form>
  `,
})
export class CreateEditUserComponent implements OnInit {
  form!: FormGroup<{
    first: FormControl<string>;
    last: FormControl<string>;
    gender: FormControl<string>;
    cell: FormControl<string>;
  }>;
  bridge = input<SPMatEntityCrudCreateEditBridge>();
  entity = input<User>();
  creating = computed(() => !this.entity() || !this.entity()?.cell);

  canCancelEdit = () => {
    return this._canCancelEdit();
  };

  _canCancelEdit() {
    if (this.form.touched) {
      return window.confirm('Lose Changes?');
    }
    return true;
  }

  constructor() {}

  ngOnInit(): void {
    this.form = this.createForm(this.entity());
    this.bridge()?.registerCanCancelEditCallback(this.canCancelEdit);
  }

  createForm(entity?: User) {
    return new FormGroup({
      first: new FormControl(entity ? entity.name.first : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      last: new FormControl(entity ? entity.name.last : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      gender: new FormControl(entity ? entity.gender : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      cell: new FormControl(entity ? entity.cell : '', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
    });
  }

  onNgSubmit() {
    const value = this.form.value;
    const bridge = this.bridge();
    const obs = this.creating()
      ? bridge?.create(value)
      : bridge?.update(this.entity()?.cell, value);
    obs?.pipe().subscribe();
  }
}

/**
 * A client component that we'll host the SPMatEntityCrudComponent. We can use
 * this to test SPMatEntityCrudComponent
 */
@Component({
  imports: [
    CommonModule,
    MatTableModule,
    SPMatEntityCrudComponent,
    CreateEditUserComponent,
    SPMatEntityCrudPreviewPaneComponent,
  ],
  template: `
    <div>
      <sp-mat-entity-crud
        entityName="user"
        itemLabel="User"
        itemLabelPlural="Users"
        [endpoint]="endpoint"
        [columns]="columns"
        [newItemSubTypes]="newSubTypes()"
        [itemActions]="itemActions"
        idKey="cell"
        [createEditFormTemplate]="createEdit"
        [previewTemplate]="userPreview"
        listPaneWrapperClass="my-list-pane-wrapper-class"
        previewPaneWrapperClass="my-preview-pane-wrapper-class"
        previewPaneContentClass="my-preview-pane-content-class"
        [pageSize]="50"
        (action)="onAction($event)"
      >
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>FULL NAME</th>
          <td mat-cell *matCellDef="let element">
            {{ element.name.title }}. {{ element.name.first }}
            {{ element.name.last }}
          </td>
        </ng-container>
      </sp-mat-entity-crud>
    </div>

    <ng-template #createEdit let-data>
      <create-edit-user-demo
        [bridge]="data.bridge"
        [entity]="data.entity"
      ></create-edit-user-demo>
    </ng-template>

    <ng-template #userPreview let-data>
      <sp-mat-entity-crud-preview-pane
        [entity]="data.entity"
        [title]="data.entity.name.first + ' ' + data.entity.name.last"
        [entityCrudComponent]="spEntityCrudComponent()!"
      >
        <div previewContent>
          <h1>{{ data.entity.name.first }} {{ data.entity.name.last }}</h1>
        </div>
      </sp-mat-entity-crud-preview-pane>
    </ng-template>
  `,
})
class SPMatEntityCrudTestComponent implements OnInit {
  displayedColumns = signal<string[]>([]);
  endpoint = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
  columns = USER_COLUMNS;
  itemActions: SPContextMenuItem[] = [
    { label: 'Edit', role: '_update_' },
    {
      label: 'Delete',
      role: '_delete_',
      disable: (user: User) => user.cell.startsWith('('),
    },
  ];
  newSubTypes = input<NewItemSubType[]>();

  spEntityCrudComponent = viewChild(SPMatEntityCrudComponent<User, 'cell'>);
  lastAction!: any;

  ngOnInit(): void {}

  onAction(action: { role: string; entity?: User }) {
    this.lastAction = action;
  }
}

/**
 * Paginator handles DRF's default pagination class response of the format:
      total: number
      next: string,
      previous: string,
      results: TEntity[]
 */
class DRFPaginator implements SPMatEntityListPaginator {
  getRequestPageParams(endpoint: string, pageIndex: number, pageSize: number) {
    return {
      page: pageIndex + 1, // account for 0-based index
      results: pageSize,
    };
  }
  parseRequestResponse(endpoint: string, params: any, resp: any) {
    console.log(`parseRequestResponse - params: ${JSON.stringify(params)}`);
    return {
      total: resp['total'],
      entities: resp['results'],
    };
    return {
      total: 0,
      entities: [],
    };
  }
}

describe('SPMatEntityCrudComponent', () => {
  let fixture!: ComponentFixture<UserEntityCrudComponent>;
  let component!: UserEntityCrudComponent;
  let componentRef!: ComponentRef<UserEntityCrudComponent>;

  async function createCrudComponent() {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatEntityListComponent,
        SPMatEntityCrudTestComponent,
        getTranslocoModule(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: '100' } },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SPMatEntityCrudComponent<User, 'cell'>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('entityName', 'user');
    componentRef.setInput('itemLabel', 'User');
    componentRef.setInput('itemLabelPlural', 'Users');
    componentRef.setInput('columns', USER_COLUMNS);
  }

  beforeEach(async () => {
    await createCrudComponent();
  });

  const autoDetectChanges = async () => {
    fixture.autoDetectChanges();
    await new Promise((res) => setTimeout(res, 120)); // wait for the async data to be loaded
  };

  it('should create', fakeAsync(() => {
    // await createCrudComponent();
    componentRef.setInput('columns', [
      {
        name: 'name',
        valueFn: (user: User) => user.name.first + ' ' + user.name.last,
      },
      'gender',
      'cell',
    ]);
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    componentRef.setInput('httpReqContext', ['cache', true]);
    let httpReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      httpReqContextReceived = options.context.get('cache') === true;
      return of(USER_DATA);
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    fixture.autoDetectChanges();
    tick(100);
    expect(component).toBeTruthy();
    const rows =
      fixture.debugElement.nativeElement.querySelectorAll('tbody tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length);
    const paginator =
      fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
    expect(httpReqContextReceived).toBeTrue();
    const columns = rows[0].querySelectorAll('td');
    // +1 for action column
    expect(columns.length).toEqual(USER_COLUMNS.length + 1);
    // check _endpointSansParams() returns URL without the QP
    expect(component._endpointSansParams()).toEqual(
      'https://randomuser.me/api/'
    );
    expect(component.getEntityUrl(USER_DATA[0].cell)).toEqual(
      `https://randomuser.me/api/${USER_DATA[0].cell}/?results=100&nat=us,dk,fr,gb`
    );
  }));

  it('should derive itemLabel[Plural] from entityName', async () => {
    componentRef.setInput('entityName', 'userProfile');
    componentRef.setInput('itemLabel', undefined);
    componentRef.setInput('itemLabelPlural', undefined);
    fixture.detectChanges();
    expect(component._entityNamePlural()).toEqual('userProfiles');
    // userProfile converted to Title Case using lodash.startCase.
    const itemLabel = await firstValueFrom(component._itemLabel());
    expect(itemLabel).toEqual('User Profile');
    // Default pluralization using 'pluralize' library
    const itemLabelPlural = await firstValueFrom(component._itemLabelPlural());
    expect(itemLabelPlural).toEqual('User Profiles');
  });

  it('should accept hybrid column definitions', fakeAsync(() => {
    // await createCrudComponent();
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    tick(100);
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length + 1);
    const paginator =
      fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
  }));

  it('should disable all action items if disableItemActions=true', fakeAsync(() => {
    // await createCrudComponent();
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableItemActions', true);
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    tick(100);
    expect(component).toBeTruthy();
    const rows =
      fixture.debugElement.nativeElement.querySelectorAll('tbody tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length);
    const paginator =
      fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
    const columns = rows[0].querySelectorAll('td');
    // columns should equal number columns as set in [columns] property value
    expect(columns.length).toEqual(USER_COLUMNS.length + 1);
    // get the action button in the last column
    const actionBtn = columns[columns.length - 1].querySelector('button');
    expect(actionBtn).toBeTruthy();
    actionBtn.click();
    fixture.detectChanges();
    tick(100);
    const matMenu = fixture.debugElement.query(By.directive(MatMenu));
    expect(matMenu).toBeTruthy();
    // mat-menu-item buttons are dynamically crated in the document root
    // and not under <mat-menu> element
    const menuItems = document.querySelectorAll(
      'button[mat-menu-item][disabled="true"]'
    );
    // one for "Update" and one for "Delete"
    expect(menuItems.length).toEqual(2);
  }));

  it('should not display "New Item" button disableCreate = true', async () => {
    // await createCrudComponent();
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    const matButton = fixture.debugElement.query(By.directive(MatButton));
    expect(matButton).toBeFalsy();
  });

  it("should refresh entity after CREATE when refreshAfterEdit='object'", async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    componentRef.setInput('crudHttpReqContext', ['cache', true]);
    const http = TestBed.inject(HttpClient);
    let httpPOSTReqContextReceived = false;
    spyOn(http, 'post').and.callFake(((
      url: string,
      data: any,
      options: any
    ) => {
      const cache = options.context.get('cache') === true;
      const crudContextParams: SPMatEntityCrudHttpContext = options.context.get(
        SP_MAT_ENTITY_CRUD_HTTP_CONTEXT
      );
      httpPOSTReqContextReceived =
        !!cache && !!crudContextParams && crudContextParams.op == 'create';
      // console.log(JSON.stringify(crudContextParams, null, 2));
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      });
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    let httpGETReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      if (url.includes('/83939830309303/')) {
        // refresh item
        const cache = options.context.get('cache') === true;
        const crudContextParams: SPMatEntityCrudHttpContext =
          options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
        httpGETReqContextReceived =
          !!cache && !!crudContextParams && crudContextParams.op == 'retrieve';
        return of({
          ...USER_DATA[0],
          cell: '888',
        });
      } else {
        // initial get users request
        return of(USER_DATA);
      }
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    // spyOn(http, 'get').and.returnValue(of(USER_DATA));
    // componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object CREATE by calling the bridge method directly
    const res = await firstValueFrom(component.create({}));
    expect(httpPOSTReqContextReceived).toBeTrue();
    expect(httpGETReqContextReceived).toBeTrue();
    expect(res.cell).toEqual('888');
  });

  it('should set custom HTTP request specifc context during CREATE', async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    componentRef.setInput('crudHttpReqContext', {
      create: ['cache', true],
      retrieve: ['cache', true],
    });
    const http = TestBed.inject(HttpClient);
    let httpPOSTReqContextReceived = false;
    spyOn(http, 'post').and.callFake(((
      url: string,
      data: any,
      options: any
    ) => {
      const cache = options.context.get('cache') === true;
      const crudContextParams: SPMatEntityCrudHttpContext = options.context.get(
        SP_MAT_ENTITY_CRUD_HTTP_CONTEXT
      );
      httpPOSTReqContextReceived =
        !!cache && !!crudContextParams && crudContextParams.op == 'create';
      // console.log(JSON.stringify(crudContextParams, null, 2));
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      });
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    let httpGETReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      if (url.includes('/83939830309303/')) {
        // refresh item
        const cache = options.context.get('cache') === true;
        const crudContextParams: SPMatEntityCrudHttpContext =
          options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
        httpGETReqContextReceived =
          !!cache && !!crudContextParams && crudContextParams.op == 'retrieve';
        return of({
          ...USER_DATA[0],
          cell: '888',
        });
      } else {
        // initial get users request
        return of(USER_DATA);
      }
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    // spyOn(http, 'get').and.returnValue(of(USER_DATA));
    // componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object CREATE by calling the bridge method directly
    const res = await firstValueFrom(component.create({}));
    expect(httpPOSTReqContextReceived).toBeTrue();
    expect(httpGETReqContextReceived).toBeTrue();
    expect(res.cell).toEqual('888');
  });

  it("should refresh entity after UPDATE when refreshAfterEdit='object'", async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    componentRef.setInput('crudHttpReqContext', ['cache', true]);
    const http = TestBed.inject(HttpClient);
    let httpGETReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      if (url.includes('/83939830309303/')) {
        // refresh item
        const cache = options.context.get('cache') === true;
        const crudContextParams: SPMatEntityCrudHttpContext =
          options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
        httpGETReqContextReceived =
          !!cache && !!crudContextParams && crudContextParams.op == 'retrieve';
        return of({
          ...USER_DATA[0],
          cell: '888',
        });
      } else {
        // initial get users request
        return of(USER_DATA);
      }
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    let httpPATCHReqContextReceived = false;
    spyOn(http, 'patch').and.callFake(((
      url: string,
      data: any,
      options: any
    ) => {
      const cache = options.context.get('cache') === true;
      const crudContextParams: SPMatEntityCrudHttpContext = options.context.get(
        SP_MAT_ENTITY_CRUD_HTTP_CONTEXT
      );
      httpPATCHReqContextReceived =
        !!cache && !!crudContextParams && crudContextParams.op === 'update';
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      });
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object UPDATE by calling the bridge method directly
    await firstValueFrom(
      component.update(USER_DATA[0]['cell'], { gender: 'M' })
    );
    expect(httpPATCHReqContextReceived).toBeTrue();
    expect(httpGETReqContextReceived).toBeTrue();
  });

  it("should refresh all entities after CREATE when refreshAfterEdit='all'", fakeAsync(() => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    const http = TestBed.inject(HttpClient);
    const getSpy = spyOn(http, 'get').and.returnValue(of(USER_DATA));
    const patchSpy = spyOn(http, 'patch').and.returnValue(of(USER_DATA[0]));
    // componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'all');
    fixture.autoDetectChanges();
    tick();
    expect(getSpy).toHaveBeenCalledTimes(1);
    // Mocking object UPDATE by calling the bridge method directly
    // This should result in another call to load all entities as we have
    // set refreshAfterEdit='all'
    firstValueFrom(component.update(USER_DATA[0]['cell'], { gender: 'M' }));
    tick();
    expect(getSpy).toHaveBeenCalledTimes(2);
  }));

  it("should call crudResponseParser after CREATE/UPDATE when refreshAfterEdit='object'", async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    let crudOpCalled = 0;
    const crudOpFn = (
      op: string,
      id: any,
      entityValue: any,
      entityCrudComponent: SPMatEntityCrudCreateEditBridge
    ) => {
      crudOpCalled++;
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      }); // Fake data
    };
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    let crudResponseParserCalled = 0;
    const crudResponseParserFn = (
      entityName: string,
      idKey: string,
      method: 'create' | 'retrieve' | 'update' | 'delete',
      resp: any
    ) => {
      crudResponseParserCalled++;
      return {
        ...USER_DATA[0],
        cell: '888', // deliberately return a different value for testing
      };
    };
    componentRef.setInput('crudResponseParser', crudResponseParserFn);
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object CREATE by calling the bridge method directly
    const res = await firstValueFrom(component.create({}));
    // Once for 'create' and another for 'get' (because refreshAfterEdit='object')
    expect(crudOpCalled).toEqual(2);
    expect(res.cell).toEqual('888'); // --> diff from crudOpFn() reply
    // Once for parsing the 'CREATE' response and the next for parsing
    // refreshAfterEdit='object' response.
    expect(crudResponseParserCalled).toEqual(2);
  });
});

describe('SPMatEntityCrudComponent client configurable behavior', () => {
  let testComponent!: SPMatEntityCrudTestComponent;
  let testComponentFixture!: ComponentFixture<SPMatEntityCrudTestComponent>;
  let testComponentRef!: ComponentRef<SPMatEntityCrudTestComponent>;
  let fixture!: ComponentFixture<UserEntityCrudComponent>;
  let component!: UserEntityCrudComponent;
  let componentRef!: ComponentRef<UserEntityCrudComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatEntityCrudTestComponent,
        getTranslocoModule(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: '100' } },
          },
        },
      ],
    });
    testComponentFixture = TestBed.createComponent(
      SPMatEntityCrudTestComponent
    );
    testComponent = testComponentFixture.componentInstance;
    testComponentRef = testComponentFixture.componentRef;
    component = testComponent.spEntityCrudComponent()!;
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    testComponentFixture.autoDetectChanges();
    tick(100);
  }));

  it('should take matColumnDef from projected content', fakeAsync(() => {
    const rows =
      testComponentFixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length + 1);
    const paginator =
      testComponentFixture.debugElement.nativeElement.querySelector(
        'mat-paginator'
      );
    expect(paginator).toBeFalsy();
    const theadRows: Element[] =
      testComponentFixture.debugElement.nativeElement.querySelectorAll(
        'thead tr th'
      );
    // +1 for 'action' column
    expect(theadRows.length).toEqual(USER_COLUMNS.length + 1);
    const nameRow = theadRows[0];
    // Column title set from content project <ng-container matColumnDef..>
    expect(nameRow.textContent).toEqual('FULL NAME');
    const wrapperDiv =
      testComponentFixture.debugElement.nativeElement.querySelector(
        'div.my-list-pane-wrapper-class'
      );
    expect(wrapperDiv).toBeTruthy();
  }));

  it('should show preview pane when a row is clicked', fakeAsync(() => {
    expect(component).toBeTruthy();
    let createEditActivatedEvents: Array<{
      activated: boolean;
      cancelled: boolean | undefined;
      mode: 'edit' | 'preview';
    }> = [];
    const sub = component.entityViewPaneActivated
      .asObservable()
      .pipe(
        tap((event) => {
          createEditActivatedEvents.push(event);
        })
      )
      .subscribe();
    const rows: HTMLElement[] =
      testComponentFixture.debugElement.nativeElement.querySelectorAll(
        'tbody tr'
      );
    expect(rows.length).toEqual(USER_DATA.length);
    rows[0].click(); // click the first row
    testComponentFixture.detectChanges();
    tick();
    const previewPane =
      testComponentFixture.debugElement.nativeElement.querySelector(
        'sp-mat-entity-crud-preview-pane'
      );
    expect(previewPane).toBeTruthy();
    // preview pane wrapper class shpould be set to 'my-preview-pane-wrapper-class'
    expect(
      testComponentFixture.debugElement.nativeElement.querySelector(
        'div.my-preview-pane-wrapper-class'
      )
    ).toBeTruthy();
    // Preview pane should contain a <div class="my-preview-pane-content-class"> which is
    // where the client content is projected.
    expect(
      previewPane.querySelector('div.my-preview-pane-content-class')
    ).toBeTruthy();
    // preview Pane should have the full name of the clicked user
    const h1 = previewPane.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1.textContent).toEqual(
      USER_DATA[0].name.first + ' ' + USER_DATA[0].name.last
    );

    const button = previewPane.querySelector('button[aria-label="Close"]');
    if (button) {
      button.click();
    }
    testComponentFixture.autoDetectChanges();
    tick();
    // Test that createEditActivatedEvent was received with the correct args
    expect(createEditActivatedEvents.length).toEqual(2);
    expect(createEditActivatedEvents[0].activated).toBeTrue();
    expect(createEditActivatedEvents[0].mode).toEqual('preview');
    expect(createEditActivatedEvents[0].cancelled).toEqual(undefined);
    expect(createEditActivatedEvents[1].activated).toBeFalse();
    expect(createEditActivatedEvents[1].mode).toEqual('preview');
    expect(createEditActivatedEvents[1].cancelled).toEqual(undefined);

    sub.unsubscribe();
  }));

  it('should show the create form when New button is selected', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const spEntityCrudComp = testComponent.spEntityCrudComponent();
    let spEntityCrudCompSpy = undefined;
    if (spEntityCrudComp) {
      spEntityCrudCompSpy = spyOn(spEntityCrudComp, 'create').and.callThrough();
    }
    const matButton = testComponentFixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    testComponentFixture.detectChanges();
    tick();
    const createEditHost = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(createEditHost).toBeTruthy();
    const inputs =
      testComponentFixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell;
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    (createEditHost.componentInstance as CreateEditUserComponent).form.controls[
      'gender'
    ].setValue('female');
    testComponentFixture.detectChanges();
    const submitButton =
      testComponentFixture.debugElement.nativeElement.querySelector(
        "button[type='submit']"
      );
    submitButton.click();
    testComponentFixture.detectChanges();
    // verify that create method has been called.
    expect(spEntityCrudCompSpy).toHaveBeenCalled();
    if (spEntityCrudComp) {
      const newCount = spEntityCrudComp
        .spEntitiesList()
        ?.store.query(getEntitiesCount());
      expect(newCount).toEqual(USER_DATA.length + 1);
    }
  }));

  it('should set form control errors when form control validation fails', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const spEntityCrudComp = testComponent.spEntityCrudComponent();
    let spEntityCrudCompSpy = undefined;
    if (spEntityCrudComp) {
      spEntityCrudCompSpy = spyOn(spEntityCrudComp, 'create').and.callThrough();
    }
    const matButton = testComponentFixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    testComponentFixture.detectChanges();
    tick();
    const createEditHost = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(createEditHost).toBeTruthy();
    const inputs =
      testComponentFixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell.slice(0, 4);
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    (createEditHost.componentInstance as CreateEditUserComponent).form.controls[
      'gender'
    ].setValue('female');
    testComponentFixture.detectChanges();
    const submitButton =
      testComponentFixture.debugElement.nativeElement.querySelector(
        "button[type='submit']"
      );
    submitButton.click();
    testComponentFixture.detectChanges();
    // verify that cell field has errors for not meeting the Validators.minLength
    // requirements. This error should look like {requiredLength: 8, actualLength: 4}
    const cellErrors = (
      createEditHost.componentInstance as CreateEditUserComponent
    ).form.controls['cell'].errors;
    expect(cellErrors).toEqual({
      minlength: { requiredLength: 8, actualLength: 4 },
    });
    // verify that create method has been called.
    expect(spEntityCrudCompSpy).toHaveBeenCalledTimes(0);
    if (spEntityCrudComp) {
      const newCount = spEntityCrudComp
        .spEntitiesList()
        ?.store.query(getEntitiesCount());
      expect(newCount).toEqual(USER_DATA.length);
    }
  }));

  it('should close the form when Bridge.close() is called', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const spEntityCrudComp = testComponent.spEntityCrudComponent();
    let spEntityCrudCompSpy = undefined;
    if (spEntityCrudComp) {
      spEntityCrudCompSpy = spyOn(spEntityCrudComp, 'create').and.callThrough();
    }
    let createEditActivatedEvents: Array<{
      activated: boolean;
      cancelled: boolean | undefined;
      mode: 'edit' | 'preview';
    }> = [];
    const sub = spEntityCrudComp?.entityViewPaneActivated
      .asObservable()
      .pipe(
        tap((event) => {
          createEditActivatedEvents.push(event);
        })
      )
      .subscribe();
    const matButton = testComponentFixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    testComponentFixture.detectChanges();
    tick();
    const createEditHost = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(createEditHost).toBeTruthy();
    const inputs =
      testComponentFixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell;
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    (createEditHost.componentInstance as CreateEditUserComponent).form.controls[
      'gender'
    ].setValue('female');
    testComponentFixture.detectChanges();
    (createEditHost.componentInstance as CreateEditUserComponent)
      .bridge()
      ?.close(false);
    // const submitButton = testComponentFixture.debugElement.nativeElement.querySelector("button[type='submit']");
    // submitButton.click();
    // testComponentFixture.detectChanges();
    // verify that create method has been called.
    expect(spEntityCrudCompSpy).toHaveBeenCalledTimes(0);
    if (spEntityCrudComp) {
      const newCount = spEntityCrudComp
        .spEntitiesList()
        ?.store.query(getEntitiesCount());
      expect(newCount).toEqual(USER_DATA.length);
    }
    // CreateEditHost component should 've been destroyed
    const createEditHostAfter = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(createEditHostAfter).toBeFalsy();
    // Test that createEditActivatedEvent was received with the correct args
    expect(createEditActivatedEvents.length).toEqual(2);
    expect(createEditActivatedEvents[0].activated).toBeTrue();
    expect(createEditActivatedEvents[0].mode).toEqual('edit');
    expect(createEditActivatedEvents[0].cancelled).toEqual(undefined);
    expect(createEditActivatedEvents[1].activated).toBeFalse();
    expect(createEditActivatedEvents[1].mode).toEqual('edit');
    expect(createEditActivatedEvents[1].cancelled).toBeFalse();
    sub?.unsubscribe();
  }));

  it('should show the new subtypes when New button is selected', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    testComponentFixture.componentRef.setInput('newSubTypes', [
      { role: 'car', label: 'Car' },
      { role: 'bike', label: 'Bike' },
    ]);
    testComponentFixture.detectChanges();
    const spEntityCrudComp = testComponent.spEntityCrudComponent();
    let spEntityCrudCompSpy = undefined;
    if (spEntityCrudComp) {
      spEntityCrudCompSpy = spyOn(spEntityCrudComp, 'create').and.callThrough();
    }
    const matButton = testComponentFixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    testComponentFixture.detectChanges();
    const matMenu = testComponentFixture.debugElement.query(
      By.directive(MatMenu)
    );
    expect(matMenu).toBeTruthy();
    const matMenuItems = testComponentFixture.debugElement.queryAll(
      By.directive(MatMenuItem)
    );
    expect(matMenuItems.length).toEqual(2);
    expect((matMenuItems[0].nativeElement as HTMLElement).innerText).toEqual(
      'Car'
    );
    expect((matMenuItems[1].nativeElement as HTMLElement).innerText).toEqual(
      'Bike'
    );
    (matMenuItems[0].nativeElement as HTMLElement).click();
    expect(testComponent.lastAction.role).toEqual('car');
    (matMenuItems[1].nativeElement as HTMLElement).click();
    expect(testComponent.lastAction.role).toEqual('bike');
  }));

  it('should show the edit form when Edit context menu item is selected', fakeAsync(() => {
    let editFormComponent = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(editFormComponent).toBeFalsy();
    // simulate item action by calling the mat-context-menu method directly
    component.onItemAction('_update_', USER_DATA[0]);
    tick();
    editFormComponent = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(editFormComponent).toBeTruthy();
  }));
});
