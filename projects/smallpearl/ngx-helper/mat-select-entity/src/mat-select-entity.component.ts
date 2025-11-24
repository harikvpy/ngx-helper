import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
  HttpContext,
  HttpContextToken
} from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  HostBinding,
  inject,
  input,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_FORM_FIELD,
  MatFormFieldControl,
} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatSelect,
  MatSelectChange,
  MatSelectModule,
} from '@angular/material/select';
import {
  provideTranslocoScope,
  TranslocoModule,
  TranslocoService,
} from '@jsverse/transloco';
import { getEntity, hasEntity, selectAllEntities, upsertEntities } from '@ngneat/elf-entities';
import {
  SPPagedEntityLoader
} from '@smallpearl/ngx-helper/entities';
import {
  SPMatEntityListPaginator,
  SPPageParams,
} from '@smallpearl/ngx-helper/mat-entity-list';
import { MatSelectInfiniteScrollDirective } from '@smallpearl/ngx-helper/mat-select-infinite-scroll';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  startWith,
  Subject,
  takeUntil,
  tap
} from 'rxjs';


export interface SPMatSelectEntityHttpContext {
  entityName: string;
  entityNamePlural: string;
  endpoint: string;
}

export const SP_MAT_SELECT_ENTITY_HTTP_CONTEXT =
  new HttpContextToken<SPMatSelectEntityHttpContext>(() => ({
    entityName: '',
    entityNamePlural: '',
    endpoint: '',
  }));

// Internal type to represent a group of entities. Used when grouping is enabled.
type EntityGroup<TEntity> = {
  label: string;
  entities: TEntity[];
};

export type SPMatSelectEntityResponseParser = <
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
>(
  response: any
) => Array<TEntity>;

// Default paginator implementation. This can handle dynamic-rest and DRF
// native pagination schemes. It also has a fallback to handle response conists
// of an array of entities.
class DefaultPaginator implements SPMatEntityListPaginator {
  getRequestPageParams(
    endpoint: string,
    page: number,
    pageSize: number
  ): SPPageParams {
    return {
      page: page + 1,
      pageSize,
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
    resp: any
  ) {
    if (Array.isArray(resp)) {
      return {
        total: resp.length,
        entities: resp,
      };
    }

    if (typeof resp === 'object') {
      const keys = Object.keys(resp);
      // Handle dynamic-rest sideloaded response
      // Rudimentary sideloaded response support. This should work for most
      // of the sideloaded responses where the main entities are stored
      // under the plural entity name key and resp['meta'] object contains
      // the total count.
      if (
        keys.includes(entityNamePlural) &&
        Array.isArray(resp[entityNamePlural])
      ) {
        let total = resp[entityNamePlural].length;
        if (
          keys.includes('meta') &&
          typeof resp['meta'] === 'object' &&
          typeof resp['meta']['total'] === 'number'
        ) {
          total = resp['meta']['total'];
        }
        return {
          total,
          entities: resp[entityNamePlural],
        };
      }

      // Handle django-rest-framework style response
      if (keys.includes('results') && Array.isArray(resp['results'])) {
        let total = resp['results'].length;
        if (keys.includes('count') && typeof resp['count'] === 'number') {
          total = resp['count'];
        }
        return {
          total,
          entities: resp['results'],
        };
      }

      // Finally, look for "items" key
      if (keys.includes('items') && Array.isArray(resp['items'])) {
        return {
          total: resp['items'].length,
          entities: resp['items'],
        };
      }
    }

    return {
      total: 0,
      entities: [],
    };
  }
}

/**
 * This is a generic component to display a <mat-select> for a FK field
 * where the select's options are dynamically loaded from the server using
 * the given url (or URL). The objects thus retrieved should have a
 * unique 'id' field that will be used as the value of each `option` element.
 * Therefore upon selection of an `option` element, the `select` value will
 * be set to the object's `id` property. By default 'id' is used as its id,
 * but this can be customized by specifying the `idKey' property value.
 */
@Component({
  selector: 'sp-mat-select-entity',
  template: `
    <div
      *transloco="let t; scope: 'sp-mat-select-entity'"
      (focusin)="onFocusIn($event)"
      (focusout)="onFocusOut($event)"
      role="group"
      [attr.aria-labelledby]="_formField?.getLabelId()"
    >
      <mat-select
        [placeholder]="placeholder"
        (opened)="onSelectOpened($event)"
        (selectionChange)="onSelectionChange($event)"
        [multiple]="multiple()"
        [(ngModel)]="selectValue"
        msInfiniteScroll
        (infiniteScroll)="onInfiniteScroll()"
      >
        <mat-select-trigger>
          {{ selectTriggerValue }}
          @if (selectTriggerValueAsArray.length > 1) {
          <span class="addl-selection-count">
            (+{{ selectTriggerValueAsArray.length - 1 }})
          </span>
          }
        </mat-select-trigger>

        <mat-option [disabled]="totalEntitiesCount() === 0">
          <ngx-mat-select-search
            class="flex-grow-1"
            [(ngModel)]="filterStr"
            (ngModelChange)="this.filter$.next($event)"
            [placeholderLabel]="
              searchText() ? searchText() : t('spMatSelectEntity.search')
            "
            [noEntriesFoundLabel]="
              notFoundText() ? notFoundText() : t('spMatSelectEntity.notFound')
            "
            [searching]="searching"
          >
          </ngx-mat-select-search>
        </mat-option>

        <ng-template #defaultOptionLabelTemplate let-entity>
          {{ _entityLabelFn()(entity) }}
        </ng-template>
        @if (!_group()) { @if (filteredValues | async; as entities) { @for
        (entity of entities; track entityId(entity)) {
        <mat-option class="sel-entity-option" [value]="entityId(entity)">
          <ng-container
            *ngTemplateOutlet="
              optionLabelTemplate() || defaultOptionLabelTemplate;
              context: { $implicit: entity }
            "
          ></ng-container>
        </mat-option>
        } } } @else { @if (filteredGroupedValues | async; as groups) { @for
        (group of groups; track group.label) {
        <mat-optgroup [label]="group.label">
          @for (entity of group.entities; track entityId(entity)) {
          <mat-option class="sel-entity-option" [value]="entityId(entity)">
            <ng-container
              *ngTemplateOutlet="
                optionLabelTemplate() || defaultOptionLabelTemplate;
                context: { $implicit: entity }
              "
            ></ng-container>
          </mat-option>
          }
        </mat-optgroup>
        } } }

        <!--
        Create New option is displayed only if there is a filter string.
        The logic behind this behavior being that user searches for a matching
        item and when not finding one, would like to add a new one.
        -->
        @if (inlineNew() && loaded() && (filterStr.length > 0 || totalEntitiesAtRemote() === 0)) {
        <mat-option
          class="add-item-option"
          value="0"
          (click)="$event.stopPropagation()"
          >⊕
          {{
            this.createNewText()
              ? this.createNewText()
              : t('spMatSelectEntity.createNew', {
                  item: this._capitalizedEntityName()
                })
          }}
        </mat-option>
        } @if (loading()) {
        <div class="loading-wrapper">
          <mat-progress-spinner
            diameter="24"
            mode="indeterminate"
          ></mat-progress-spinner>
        </div>
        }
      </mat-select>
    </div>
  `,
  styles: [
    `
      .add-item-option {
        padding-top: 2px;
        border-top: 1px solid var(--mat-sys-outline);
      }
      .addl-selection-count {
        opacity: 0.75;
        font-size: 0.8em;
      }
      .loading-wrapper {
        display: flex;
        justify-content: center;
        padding: 8px 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoModule,
    NgxMatSelectSearchModule,
    MatSelectInfiniteScrollDirective,
  ],
  providers: [
    provideTranslocoScope('sp-mat-select-entity'),
    { provide: MatFormFieldControl, useExisting: SPMatSelectEntityComponent },
  ],
})
export class SPMatSelectEntityComponent<
    TEntity extends { [P in IdKey]: PropertyKey },
    IdKey extends string = 'id'
  >
  extends SPPagedEntityLoader<TEntity, IdKey>
  implements
    OnInit,
    OnDestroy,
    AfterViewInit,
    ControlValueAccessor,
    MatFormFieldControl<string | number | string[] | number[]>
{
  // We cache the entities that we fetch from remote here. Cache is indexed
  // by the endpoint. Each endpoint also keeps a refCount, which is incremented
  // for each instance of the component using the same endpoint. When this
  // refcount reaches 0, the endpoint is removed from the cache.
  //
  // This mechanism is to suppress multiple fetches from the remote from the
  // same endpoint as that can occur if a form has multiple instances of
  // this component with the same url.
  // static _entitiesCache = new Map<
  //   string,
  //   { refCount: number; entities: Array<any> }
  // >();

  //**** OPTIONAL ATTRIBUTES ****//

  // Entity label function - function that takes an entity object and returns
  // a string label for it. If not specified, a default label function is used
  // that returns the value of 'name' or 'label' or 'title' property. If
  // none of these properties are present, the entity's id is returned as
  // string.
  labelFn = input<(entity: TEntity) => string>();

  // Entity filter function - return a boolean if the entity is to be included
  // in the filtered entities list.
  filterFn = input<(entity: TEntity, search: string) => boolean>();

  // Set to true to show "Add { item }" option in the select dropdown.
  // Selecting this option, will emit `createNewItemSelected` event.
  inlineNew = input<boolean>(false);

  // Set to true to allow multiple option selection. The returned value
  // would be an array of entity ids.
  multiple = input<boolean>(false);

  /**
   * The entity key name that is used to classify entities into groups.
   * Entities with the same key value will be grouped together. If this is
   * specified, grouping will be enabled.
   * @see groupByFn
   */
  groupOptionsKey = input<string>();

  /**
   * A function that takes a TEntity and returns the group id (string)
   * that the entity belongs to. If this is specified, grouping of entities
   * in the select will be enabled. This takes precedence over
   * `groupOptionsKey`.
   * @see groupOptionsKey
   */
  groupByFn = input<(entity: TEntity) => string>();

  @Output() selectionChange = new EventEmitter<TEntity | TEntity[]>();
  @Output() createNewItemSelected = new EventEmitter<void>();

  // i18n localization support toallow per component customization of
  // some strings used.
  readonly searchText = input<string>();
  readonly notFoundText = input<string>();
  readonly createNewText = input<string>();

  controlType = 'sp-mat-select-entity';

  /**
   * Template for the option label. If not provided, the default label
   * function will be used. Option label is what is placed inside the
   * <mat-option> tag. The template gets an implicit 'entity' variable
   * in the context, value for which is the entity object.
   *
   * For example:
   * ```
   *  <sp-mat-select-entity
   *    [url]="'/api/v1/customers/'"
   *    [labelFn]="entity => entity.name"
   *    [optionLabelTemplate]="optionLabelTemplate"
   *  ></sp-mat-select-entity>
   *  <ng-template #optionLabelTemplate let-entity>
   *    {{ entity.name }} - {{ entity.description }}
   *  </ng-template>
   * ```
   */
  optionLabelTemplate = input<TemplateRef<any>>();

  // a computed version of labelFn that provides a default implementation
  protected _entityLabelFn = computed<(entity: TEntity) => string>(() => {
    const fn = this.labelFn();
    if (fn) {
      return fn;
    }
    return (entity: TEntity) => {
      return (
        (entity as any)['name'] ||
        (entity as any)['label'] ||
        (entity as any)['title'] ||
        String((entity as any)[this.idKey()])
      );
    };
  });

  // Whether to group options. Grouping is enabled when either groupOptionsKey
  // or groupByFn is specified.
  protected _group = computed<boolean>(() => {
    return !!this.groupOptionsKey() || !!this.groupByFn();
  });

  protected _groupEntitiesKey = computed<string>(() => {
    const groupOptionsKey = this.groupOptionsKey();
    return groupOptionsKey
      ? groupOptionsKey
      : this.entityName()
      ? this._pluralEntityName()
      : 'items';
  });

  // For the global paginator. We'll abstract this into an independent
  // configuration that can be shared across both mat-entity-list and
  // mat-select-entity later.
  // entityListConfig = getEntityListConfig();

  // protected _paginator = computed<SPMatEntityListPaginator>(() => {
  //   const paginator = this.paginator();
  //   const entityListConfigPaginator = this.entityListConfig
  //     ?.paginator as SPMatEntityListPaginator;
  //   return paginator
  //     ? paginator
  //     : entityListConfigPaginator ?? new DefaultPaginator();
  // });

  stateChanges = new Subject<void>();
  focused = false;
  touched = false;

  selectValue!: string | number | string[] | number[];
  // To store initial value when writeValue() is called before entities are
  // loaded, either by entities() input or via paged loader. This is especially
  // necessary when the elf store uses an idKey other than 'id'.
  _initialValue: string | number | string[] | number[] | undefined = undefined;

  // For storing last select value, which we use to restore the select's value
  // to when New Item is selected. This ensures that when New Item is selected,
  // the select's value remains the same. If the newly created item is to be
  // set as the select's value, the corresponding TEntity has to be added
  // to _entities (via addEntity()) and then selected by setting the
  // corresponding formControl's value to the entity's id.
  lastSelectValue!: string | number | string[] | number[];
  searching = false;
  filterStr: string = '';

  filter$ = new Subject<string>();

  // ControlValueAccessor callbacks
  onChanged = (_: any) => {};
  onTouched = () => {};

  // @ViewChild(MatSelect) matSelect!: MatSelect;
  matSelect = viewChild(MatSelect);

  filteredValues = new Subject<TEntity[]>();
  filteredGroupedValues = new Subject<EntityGroup<TEntity>[]>();

  destroy = new Subject<void>();

  static nextId = 0;
  @HostBinding() id = `sp-select-entity-${SPMatSelectEntityComponent.nextId++}`;
  private _placeholder!: string;
  //protected http = inject(HttpClient);
  protected cdr = inject(ChangeDetectorRef);
  protected _elementRef = inject(ElementRef<HTMLElement>);
  protected _formField = inject(MAT_FORM_FIELD, { optional: true });
  public ngControl = inject(NgControl, { optional: true });
  transloco = inject(TranslocoService);

  // pagedEntityLoader!: SPPagedEntityLoader<TEntity, IdKey>;

  constructor() {
    super();
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  /**
   * Conditions for loading entities:
   *
   * 1. When the select is opened, if entities have not already been loaded.
   * 2. When the search string changes.
   * 3. When the scroll reaches the bottom and more entities are available
   *    to be loaded.
   *
   * We need to create an 'observer-loop' that can handle the above.
   */

  ngOnInit() {
    this.startLoader();
    // A rudimentary mechanism to detect which of the two observables
    // emitted the latest value. We reset this array to 'false' after
    // processing every combined emission.
    const emittedObservable = [false, false];
    const store$ = this.store.pipe(selectAllEntities());
    const filter$ = this.filter$.pipe(
      startWith(''),
      distinctUntilChanged(),
      debounceTime(400)
    );

    const emittedStatusObservable = (obs: Observable<any>, index: number) =>
      obs.pipe(tap(() => (emittedObservable[index] = true)));

    // We need to determine if the emission is owing to a change in
    // filterStr or a change in the entities in pagedEntityLoader.store$.
    //
    //  1. If entities in pagedEntityLoader.store$ have changed, we just need
    //     to filter the entities in local store using the current filterStr.
    //  2. If filterStr has changed, there are two cases to handle:-
    //     a. If all entities have been loaded, we don't need to reload
    //        entities. Instead we just have to filter the entities in
    //        local store using the filterStr.
    //     b. If all entities have not been loaded, we trigger a server
    //        load with the new filterStr as the search param.
    //
    // The following logic implements the above.
    combineLatest([
      emittedStatusObservable(store$, 0),
      emittedStatusObservable(filter$, 1),
    ])
      .pipe(
        takeUntil(this.destroy),
        tap(([entities, filterStr]) => {
          if (emittedObservable.every((eo) => eo)) {
            // initial emission. This can be combined with the case immediately
            // below it. But we keep it separate for clarity.
            emittedObservable[0] = emittedObservable[1] = false;
            this.filterEntities(entities, filterStr);
          } else if (emittedObservable[0]) {
            emittedObservable[0] = false;
            this.filterEntities(entities, filterStr);
          } else {
            emittedObservable[1] = false;
            if (this.allEntitiesLoaded()) {
              this.filterEntities(entities, filterStr);
            } else {
              // If filterStr has changed and not all entities have been loaded
              // store will be reset and entities reloaded from remote with
              // the new filterStr as the search param.
              this.loadNextPage(filterStr);
            }
          }
        })
      )
      .subscribe();

    if (this._initialValue !== undefined) {
      this.writeValue(this._initialValue);
      this._initialValue = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
    this.stopLoader();
    // this.removeFromCache();
    this.stateChanges.complete();
  }

  ngAfterViewInit(): void {
    // I'm not sure this is how this logic is right, but this seems to work.
    // if (this.ngControl && this.ngControl.control?.validator) {
    //   const validator = this.ngControl.control.validator;
    //   const res = validator(this.ngControl.control);
    //   if (res && res['required']) {
    //     this.required = true;
    //   }
    // }
    // load first page
    // this.loadMoreEntities();
  }

  addEntity(entity: TEntity) {
    this.store.update(upsertEntities(entity));
    this.cdr.detectChanges();
  }

  get selectTriggerValue() {
    if (this.selectValue) {
      const firstSelected = Array.isArray(this.selectValue)
        ? this.selectValue[0]
        : this.selectValue;
      const selectedEntity = this.getEntity(firstSelected as TEntity[IdKey]);
      return selectedEntity ? this._entityLabelFn()(selectedEntity) : '';
    }
    return '';
  }

  get selectTriggerValueAsArray() {
    return Array.isArray(this.selectValue)
      ? (this.selectValue as Array<string | number>)
      : [];
  }

  entityId(entity: TEntity) {
    return (entity as any)[this.idKey()];
  }

  writeValue(entityId: string | number | string[] | number[]): void {
    // If the component has not yet started (calling startLoader()), we store
    // the initial value in _initialValue and return. The actual setting of
    // the value will happen after startLoader() is called from ngOnInit().
    if (!this.hasStarted()) {
      this._initialValue = entityId;
      return;
    }

    const store = this.store;
    const entities = this.getEntities();
    if (Array.isArray(entityId)) {
      if (this.multiple()) {
        const selectedValues: any[] = [];
        entityId.forEach((id) => {
          if (store.query(hasEntity(id as TEntity[IdKey]))) {
            selectedValues.push(id);
          }
        });
        this.selectValue = selectedValues;
        this.cdr.detectChanges();
      }
    } else {
      if (store.query(hasEntity(entityId as TEntity[IdKey]))) {
        // if (this._entities.has(entityId)) {
        this.selectValue = entityId;
        if (this.filterStr) {
          this.filterStr = '';
          // this.filterNonGroupedEntities(entities, this.filterStr);
        }
        this.cdr.detectChanges();
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChanged = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  @Input()
  get entities(): TEntity[] {
    return this.getEntities();
  }

  set entities(items: TEntity[]) {
    this.setEntities(items);
  }

  @Input()
  get value(): string | number | string[] | number[] {
    return this.selectValue;
  }
  set value(val: string | number | string[] | number[]) {
    this.selectValue = val;
    this.stateChanges.next();
  }
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input('aria-describedby') userAriaDescribedBy!: string;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  get required() {
    return (
      this._required ??
      this.ngControl?.control?.hasValidator(Validators.required)
    );
  }
  set required(req: boolean) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  // Deliberately 'undefined' so that `get required()` will return the state
  // from ngControl's validators.
  private _required!: boolean;

  @Input()
  get disabled(): boolean {
    return this._disabled ?? this.ngControl?.control?.disabled;
  }
  set disabled(value: BooleanInput) {
    const disabled = coerceBooleanProperty(value);
    if (disabled !== this._disabled) {
      this.setDisabledState(disabled);
      this.stateChanges.next();
    }
  }
  // Same as `_required`, deliberately `undefined` by default.
  private _disabled!: boolean;

  get empty() {
    return !this.value;
  }

  get errorState(): boolean {
    return !!this.ngControl?.invalid && this.touched;
  }

  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this._elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  setDescribedByIds(ids: string[]) {}

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != 'mat-select') {
      this._elementRef.nativeElement.querySelector('mat-select').focus();
    }
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
    const matSelect = this.matSelect();
    if (matSelect) {
      matSelect.setDisabledState(isDisabled);
      this.cdr.detectChanges();
    }
  }

  onSelectOpened(ev: any) {
    // Store the current select value so that we can restore it if user
    // eventually selects 'New Item' option.
    this.lastSelectValue = this.selectValue;
    // If values have not been loaded from remote, trigger a load.
    if (this.totalEntitiesAtRemote() === 0) {
      // first load
      this.loadNextPage();
    }
  }

  onSelectionChange(ev: MatSelectChange) {
    // console.log('SelectionChange - sel:', ev);
    if (Array.isArray(ev.value)) {
      this.selectValue = ev.value;
      this.onTouched();
      this.onChanged(ev.value);
      const selectedEntities: TEntity[] = ev.value.map((id) =>
        this.store.query(getEntity(id))
      ) as TEntity[];
      this.selectionChange.emit(selectedEntities);
    } else {
      if (ev.value !== '0') {
        this.selectValue = ev.value;
        this.onTouched();
        this.onChanged(ev.value);
        this.selectionChange.emit(this.store.query(getEntity(ev.value)));
      } else {
        // New Item activated, return value to previous value. We track
        // previous value via 'lastSelectValue' member which is updated
        // whenever the select is opened.
        if (this.ngControl) {
          this.ngControl.control?.setValue(this.lastSelectValue);
        }
        ev.source.value = this.lastSelectValue;
        this.createNewItemSelected.emit();
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * Wrapper to filter entities based on whether grouping is enabled or not.
   * Calls one of the two filtering methods -- filterGroupedEntities() or
   * filterNonGroupedEntities().
   * @param entities
   * @param filterStr
   * @returns
   */
  filterEntities(entities: TEntity[], filterStr: string) {
    this.searching = true;
    let retval: number | undefined;
    if (this._group()) {
      this.filterGroupedEntities(entities, filterStr);
    } else {
      this.filterNonGroupedEntities(entities, filterStr);
    }
    this.searching = false;
  }

  /**
   * Filters the entities based on the search string.
   * @param search The search string to filter entities.
   * @returns The number of entities in the filtered result set or undefined.
   */
  filterNonGroupedEntities(entities: TEntity[], search: string) {
    const searchLwr = search.toLocaleLowerCase();
    if (!search) {
      this.filteredValues.next(entities.slice());
    } else {
      const filteredEntities = entities.filter((member) => {
        const filterFn = this.filterFn();
        if (filterFn) {
          return filterFn(member, search);
        }
        const labelFn = this._entityLabelFn();
        return labelFn(member).toLocaleLowerCase().includes(searchLwr);
      });
      this.filteredValues.next(filteredEntities);
    }
  }

  /**
   * Filtering grouped entities logic works like this. If the search string
   * matches a group label, the entire group is to be included in the results.
   * However, if the search string only matches certain entities, only those
   * groups are to be included and within those groups, only entities whose
   * label matches the search string are to be included in the result set.
   * @param search
   * @returns number of groups in the filtered result set.
   */
  filterGroupedEntities(entities: TEntity[], search: string) {
    const searchLwr = search.toLocaleLowerCase();
    // First filter entities by the search string, if it's specified
    let filteredEntities: TEntity[];
    if (!search) {
      filteredEntities = entities;
    } else {
      filteredEntities = entities.filter((member) => {
        const filterFn = this.filterFn();
        if (filterFn) {
          return filterFn(member, search);
        }
        const labelFn = this._entityLabelFn();
        return labelFn(member).toLocaleLowerCase().includes(searchLwr);
      });
    }
    this.filteredGroupedValues.next(this.groupEntities(filteredEntities));
  }

  /**
   * Helper to arrange the given array of entities into groups based on the
   * groupByFn or groupOptionsKey. groupByFn takes precedence over
   * groupOptionsKey.
   * @param entities
   * @returns EntityGroup<TEntity>[]
   */
  protected groupEntities(entities: TEntity[]): EntityGroup<TEntity>[] {
    let groupByFn!: (entity: TEntity) => string;
    if (this.groupByFn()) {
      groupByFn = this.groupByFn()!;
    } else if (this.groupOptionsKey()) {
      groupByFn = (entity: TEntity) => {
        const key = this.groupOptionsKey()!;
        return (entity as any)[key] ?? '???';
      };
    }

    const groupedEntitiesMap = new Map<string | number, TEntity[]>();
    entities.forEach((entity) => {
      const groupId = groupByFn!(entity);
      if (!groupedEntitiesMap.has(groupId)) {
        groupedEntitiesMap.set(groupId, []);
      }
      groupedEntitiesMap.get(groupId)!.push(entity);
    });
    let entityGroups: EntityGroup<TEntity>[] = [];
    groupedEntitiesMap.forEach((entities, groupId) => {
      entityGroups.push({
        label: String(groupId),
        entities,
      });
    });
    return entityGroups;
  }

  // private existsInCache() {
  //   const cacheKey = this.getCacheKey();
  //   if (cacheKey) {
  //     return SPMatSelectEntityComponent._entitiesCache.has(cacheKey);
  //   }
  //   return false;
  // }

  // private getCacheKey() {
  //   if (typeof this.url() !== 'function') {
  //     let params!: HttpParams;
  //     if (this.httpParams) {
  //       params = new HttpParams({
  //         fromString: this.httpParams.toString(),
  //       });
  //     } else {
  //       params = new HttpParams();
  //     }
  //     // params = params.set('paginate', false)
  //     return `${this.url}?${params.toString()}`;
  //   }
  //   return ''; // empty string evalutes to boolean(false)
  // }

  // private getFromCache() {
  //   const cacheKey = this.getCacheKey();
  //   if (cacheKey && SPMatSelectEntityComponent._entitiesCache.has(cacheKey)) {
  //     return SPMatSelectEntityComponent._entitiesCache.get(cacheKey)
  //       ?.entities as TEntity[];
  //   }
  //   return [];
  // }

  // private addToCache(entities: TEntity[]) {
  //   const cacheKey = this.getCacheKey();
  //   if (cacheKey) {
  //     if (!SPMatSelectEntityComponent._entitiesCache.has(cacheKey)) {
  //       SPMatSelectEntityComponent._entitiesCache.set(cacheKey, {
  //         refCount: 0,
  //         entities,
  //       });
  //     }
  //     const cacheEntry =
  //       SPMatSelectEntityComponent._entitiesCache.get(cacheKey);
  //     cacheEntry!.refCount += 1;
  //   }
  // }

  // private removeFromCache() {
  //   const cacheKey = this.getCacheKey();
  //   if (cacheKey) {
  //     const cacheEntry =
  //       SPMatSelectEntityComponent._entitiesCache.get(cacheKey);
  //     if (cacheEntry) {
  //       cacheEntry!.refCount -= 1;
  //       if (cacheEntry.refCount <= 0) {
  //         SPMatSelectEntityComponent._entitiesCache.delete(cacheKey);
  //       }
  //     }
  //   }
  // }

  private getHttpReqContext() {
    const context = new HttpContext();
    const entityName = this.entityName;
    context.set(SP_MAT_SELECT_ENTITY_HTTP_CONTEXT, {
      entityName: this.entityName(),
      entityNamePlural: this._pluralEntityName(),
      endpoint: this.url() as string,
    });
    return context;
  }

  /**
   * If more entities are available, load the next page of entities.
   * This method is triggered when user scrolls to the bottom of the options
   * list. Well almost to the bottom of the options list. :)
   */
  onInfiniteScroll() {
    if (this.hasMore() && !this.loading()) {
      this.loadNextPage();
    }
  }
}
