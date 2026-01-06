import { HttpContextToken, HttpParams } from "@angular/common/http";
import { SPContextMenuItem } from "@smallpearl/ngx-helper/mat-context-menu";
import { Observable } from "rxjs";

/**
 * Prototype of the function to parse the CRUD action response.
 */
export type SPMatEntityCrudResponseParser = (
  entityName: string,
  idKey: string,
  method: string, // 'create' | 'retrieve' | 'update' | 'delete',
  resp: any
) => any|undefined;


/**
 * Global config for SPMatEntityList component.
 */
export interface SPMatEntityCrudConfig {
  /**
   * The item actions that will be shown for each item in the list.
   * This defaults to 'Update' & 'Delete' actions, but can be customized
   * by this property. Note the item actions can be set for individual
   * <sp-mat-entity-crud> component through its itemActions property.
   */
  defaultItemActions?: SPContextMenuItem[];
  /**
   * Global crud response parser.
   */
  crudOpResponseParser?: SPMatEntityCrudResponseParser;
}

/**
 * This is the interface through which the client provided CRUD form component
 * interacts with the 'host' SPMatEntityCrudComponent. When the form wants to
 * submit an entity to the server (for create or update), it should call the
 * one of the create or update methods. The interface also provides other
 * methods for the form component to interact with SPMatEntityCrudComponent
 * such as refresh its entities list, close the form pane, etc.
 *
 * The interface name has a 'Bridge' as the interface acts as a bridge between
 * the client provided form handler component and the host
 * SPMatEntityCrudComponent.
 */
export interface SPMatEntityCrudCreateEditBridge {
  /**
   * Returns the entity name as provided to the host SPMatEntityCrudComponent.
   * @returns The entity name string.
   */
  getEntityName(): string;

  /**
   * Returns the entity id key as provided to the host SPMatEntityCrudComponent.
   * @returns The entity id key string.
   */
  getIdKey(): string;

  /**
   * Get Entity url
   * @param cancel
   * @returns
   */
  getEntityUrl(entityId: any): string;

  /**
   * Close the edit/update form pane. This WON'T call the 'cancelEditCallback'
   * even if one is registered.
   */
  close: (cancel: boolean) => void;
  /**
   * Client form view can register a callback that will be invoked by the
   * framework when user cancels the create/edit operation by clicking on the
   * close button on the top right.
   * @param callback
   * @returns None
   */
  registerCanCancelEditCallback: (callback: () => boolean) => void;
  // Parameters of type any are entity values are typically the output of
  // form.value and therefore their types would not necessarily match TEntity.
  // id can be typed as TEntity[Idkey], but TSC doesn't allow that yet.
  /**
   * Create a new instance of TEntity, by sending a POST request to remote.
   * @param entityValue This is the typically the output of Reactive form's
   * form.value. Since this value's shape may be different from TEntity and is
   * known only to client form, we use 'any'.
   * @returns None
   * @inner Implementation will show a busy wheel centered on the form
   * view while the async function to update the object remains active.
   */
  create: (entityValue: any) => Observable<any>;
  /**
   * Update the entity with id `id` with new values in entityValue.
   * @param id TEntity id
   * @param entityValue Entity values to be updated.
   * @returns None
   * @inner Implementation will show a busy wheel centered on the form
   * view while the async function to update the object remains active.
   */
  update: (id: any, entityValue: any) => Observable<any>;

  /**
   * Load the entity with the given id from server.
   * @param id The id of the entity to load.
   * @param params Additional parameters for loading the entity. This will
   * be passed to the underlying data service's 'get' method. This can be a
   * query parameters string or HttpParams object.
   * @returns Observable of the loaded entity.
   */
  loadEntity: (id: any, params: string|HttpParams) => Observable<any>;
}

/**
 * Prototype of the function that will be used instead of HttpClient for
 * CRUD operations.
 * @param op - the CRUD operation being requested
 * @param entityValue - The entity or entity value upon which the operation
 * is being requested. for 'create' & 'update' this will be the value
 * of the reactive form. This is typically form.value or the 2nd arg to create
 * & update methods of SPMatEntityCrudCreateEditBridge.
 */
export type CRUD_OP_FN<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> = (
  op: string,
  id: TEntity[IdKey] | undefined, // valid only for 'get', 'update' & 'delete'
  entityValue: any, // valid only for 'create' & 'update'
  entityCrudComponent: any,
) => Observable<TEntity | null>;


export type ALLOW_ITEM_ACTION_FN<TEntity> = (entity: TEntity, action: string) => boolean;

/**
 * This interface is used to define sub types for the "New {{item}}" button on
 * top of the CRUD UI. An array of these is provided as the value to the
 * component property 'newItemSubTypes'.
 */
export interface NewItemSubType {
  /**
   * A role string that will be passed as argument to the (action) event
   * handler. This string allows the event handler to distinguish the selected
   * sub-type.
   *
   * The special keyword '_new_' can be used to activate the
   * `createEditTemplate` template if one is provided. In this case the params
   * element value (see below) can be used in the template to distinguish
   * between different menu items.
   */
  role: string;
  /**
   * Label displayed in the menu representing this role.
   */
  label: string;
  /**
   * Arbitrary value that will be passed to the 'createEditTemplate' in the
   * $implicit template context as 'params'. You can access this in the
   * template like below (see `data.params`):-
      ```
      <ng-template #createEdit let-data>
        <app-create-edit-entity-demo
          [bridge]="data.bridge"
          [entity]="data.entity"
          [params]="data.params"
        ></app-create-edit-entity-demo>
      </ng-template>
      ```

    If params is an object and it includes the key 'title', its value will be
    used as the title for the edit form.
   */
  params?: any;
}

export type CrudOp = 'create'|'retrieve'|'update'|'delete'|undefined;

export interface SPMatEntityCrudHttpContext {
  entityName: string;
  entityNamePlural: string;
  endpoint: string;
  op: CrudOp;
}

export const SP_MAT_ENTITY_CRUD_HTTP_CONTEXT =
  new HttpContextToken<SPMatEntityCrudHttpContext>(() => ({
    entityName: '',
    entityNamePlural: '',
    endpoint: '',
    op: undefined,
  }));
