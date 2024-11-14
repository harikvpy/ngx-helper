import { SPContextMenuItem } from "@smallpearl/ngx-helper/mat-context-menu";
import { Observable } from "rxjs";

/**
 * Global config for SPMatEntityList component.
 */
export interface SPMatEntityCrudConfig {
  i18n: {
    newItemLabel: (itemLabel: string) => string;
    editItemLabel: (itemLabel: string) => string;
    edit: string;
    delete: string;
    deleteItemHeader: (itemLabel: string) => string;
    deleteItemMessage: (itemLabel: string) => string;
    itemDeletedNotification: (itemLabel: string) => string;
    createdItemNotification: (itemLabel: string) => string;
    updatedItemNotification: (itemLabel: string) => string;
    loseChangesPrompt: string;
  }
  defaultItemActions?: SPContextMenuItem[];
  listPaneWrapperClass?: string;
  previewPaneWrapperClass?: string;
  previewPaneContentClass?: string;
}

/**
 * This is the interface through which the client provide CRUD form component
 * interacts with the 'host' SPMatEntityCrudComponent. When the form wants to
 * submit an entity to the server (for create or update), it should call the
 * one of the two methods below.
 */
export interface SPMatEntityCrudCreateEditBridge {
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
  op: 'create' | 'update' | 'delete',
  entityValue: any,
  entityCrudComponent: any
) => Observable<TEntity | null>;
