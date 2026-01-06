import { HttpParams } from "@angular/common/http";
import { SPContextMenuItem } from "@smallpearl/ngx-helper/mat-context-menu";
import { Observable } from "rxjs";

export const ITEM_ACTION_UPDATE = '_update_';
export const ITEM_ACTION_DELETE = '_delete_';

/**
 * SPMatEntityCrudCreateEditBridge implementer uses this interface to
 * communicate with the parent SPMatEntityCreateComponent. The bridge
 * component would use the hideCreateEdit() to close itself, when user cancels
 * the create/edit operation.
 */
export interface SPMatEntityCrudComponentBase<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> {
  /**
   * Wrappers around entityName & entityNamePlural properties.
   */
  getEntityName(): string;
  getEntityNamePlural(): string;
  /**
   * Wrapper around idKey property.
   */
  getIdKey(): string;
  /**
   * This method should return the entity URL for the given entity id.
   * The entity URL should include any additional query parameters that were
   * passed to the SPMatEntityCrudComponentBase component's `url` property.
   * @param id
   */
  getEntityUrl(id: TEntity[IdKey]|undefined): string;
  /**
   * FormViewHostComponent will call this to close the Create/Edit pane.
   * SPMatEntityCrudComponentBase implementor will destroy the client form
   * view and hide the Create/Edit form view pane and show the hidden
   * entity list view.
   * @returns
   */
  closeCreateEdit: (cancelled: boolean) => void;
  /**
   * Used internally by FormViewHostComponent to determine if the client form
   * view wants to intercept user's cancel the create/edit operation. Perhaps
   * with the Yes/No prompt 'Lose changes?'
   * @returns boolean indicating it's okay to cancel the create/edit operation.
   */
  canCancelEdit: () => boolean;
  /**
   * Client form view can register a callback that will be invoked by the
   * framework when user cancels the create/edit operation by clicking on the
   * close button on the top right.
   * @param callback
   * @returns
   */
  registerCanCancelEditCallback: (callback: () => boolean) => void;
  /**
   * Initiates update on the given entity.
   * @returns
   */
  triggerEntityUpdate: (entity: TEntity) => void;
  /**
   * Initiates entity delete.
   * @returns
   */
  triggerEntityDelete: (entity: TEntity) => void;
  /**
   * Called by client form-view host component to close a new entity.
   * @param entityValue The ReactiveForm.value object that the server expects
   * to create a new object.
   * @returns The new Entity object returned by the server. For typical REST
   * API, this would be of the same shape as the objects returned by the
   * REST's GET request.
   */
  create: (entityValue: any) => Observable<any>;
  /**
   * Called by client form-view host component to close a new entity.
   * @param id The id of the entity being edited.
   * @param entityValue The ReactiveForm.value object that the server expects
   * to update the new object.
   * @returns The new Entity object returned by the server. For typical REST
   * API, this would be of the same shape as the objects returned by the
   * REST's GET request.
   */
  update: (id: any, entityValue: any) => Observable<any>;
  /**
   * Load the entity with the given id from server.
   * @param id The id of the entity to load.
   * @param params Additional parameters for loading the entity.
   * @returns An observable of the loaded entity.
   */
  loadEntity: (id: any, params: string | HttpParams) => Observable<TEntity>;
  /**
   * Close the preview pane.
   * @returns
   */
  closePreview: () => void;
  /**
   * Returns the context menu items for the entity. This can be used to build
   * the context menu for an entity in its preview pane toolbar.
   * @returns
   */
  getItemActions(entity?: TEntity): SPContextMenuItem[];
  /**
   * Returns the class to be used for the preview pane content. This interface
   * is provided to allow the PreviewPaneComponent to access the client
   * configured class for the preview pane content.
   */
  getPreviewPaneContentClass(): string;

  getFormPaneWrapperClass(): string;

  getFormPaneContentClass(): string;

  getItemLabel(): string | Observable<string>;

  getItemLabelPlural(): string | Observable<string>;
  /*
   * Remove the entity with the given id from the list of entities.
   * This is typically called by the client when it peforms the delete
   * operation itself without using the MatEntityCrud's delete operation.
   *
   * @param id The id of the entity to remove.
   * @returns None
   **/
  removeEntity(id: TEntity[IdKey]): void;
  /**
   * Update the entity with the given id in the list of entities.
   * This is typically called by the client when it has performed an update
   * on the entity itself and want to reflect the resulting changed
   * entity in the list view.
   *
   * @param id The id of the entity to update.
   * @param data The updated entity.
   */
  updateEntity(id: TEntity[IdKey], data: TEntity): void;
  /**
   * Perform a custom action on the entity endpoint. The action is specified
   * by the verb argument, which will be used to derive the final URL. This
   * is keeping in line with DRF specification where viewsets can define
   * custom action methods, which translate into endpoints with the same name
   * ast he action method.
   * @param id id of the entity to perform the action on.
   * @param verb The action verb, which will be appended to the entity URL to
   * derive the final URL for the POST request.
   * @param addlParams additional query parameters to include in the request.
   * Called `additional` as these are in addition to the query params specified
   * in the CRUD's endpoint.
   * @param data the data to send with the request for the POST
   * @returns Observable<TEntity>
   */
  doEntityAction(
    id: TEntity[IdKey],
    verb: string,
    addlParams: HttpParams,
    data: any,
    busyWheelName: string
  ): Observable<any>;
}
