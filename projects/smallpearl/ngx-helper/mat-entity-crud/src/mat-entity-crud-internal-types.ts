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
export interface SPMatEntityCrudComponentBase<TEntity> {
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
   * Close the preview pane.
   * @returns
   */
  closePreview: () => void;
  /**
   * Returns the context menu items for the entity. This can be used to build
   * the context menu for an entity in its preview pane toolbar.
   * @returns
   */
  getItemActions(): SPContextMenuItem[];

  /**
   * Returns the class to be used for the preview pane content. This interface
   * is provided to allow the PreviewPaneComponent to access the client
   * configured class for the preview pane content.
   */
  getPreviewPaneContentClass(): string;
}
