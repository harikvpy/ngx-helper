import { HttpParams } from "@angular/common/http";
import { SPContextMenuItem } from "@smallpearl/ngx-helper/mat-context-menu";

/**
 * Describes an action on an item in the MatEntityCrud component. Actions are
 * shown in the context menu for each entity in the MatEntityCrud component.
 * The action is triggered when the user selects the corresponding menu item.
 * There are two ways to handle the action when it is triggered (user selects
 * the corresponding menu item):
 *
 * 1. If the action's 'role' property is one of the predefined roles
 *   ('_edit_', '_view_', '_delete_'), the MatEntityCrud component handles
 *   the action internally by opening the corresponding dialog (edit/view)
 *   or performing the delete operation.
 * 2. If the action maps to a HTTP REST API endpoint on the item at the server,
 *   the MatEntityCrud component can perform the HTTP request. To enable this,
 *   the application must set the action's 'behavior' property to 'http' and
 *   if the REST request differs from the default POST to the entity's base URL
 *   with the action's 'role' appended as the URL path, provide the necessary
 *   HTTP request parameters in the 'httpRequestParameters' property.
 * 3. For all other actions, the MatEntityCrud component emits an 'action'
 *   event with the action's 'role' and the entity as arguments. The
 *   application can listen to this event and handle the action as needed.
 *
 * @template TEntity The type of the entity on which the action is performed.
 */
export interface MatEntityCrudItemAction<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> extends SPContextMenuItem {

  /**
   * HTTP request parameters for actions that map to HTTP REST API
   * endpoints on the item at the server. This property is used when
   * 'actionBehavior' is set to 'http'.
   *
   * If not specified, and behavior is set to 'http', a POST request is
   * made to the entity's base URL with the action's 'role' appended
   * as the URL path.
   */
  httpRequestParameters?: {
    // HTTP method for the request.
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    // Optional URL path to be appended to the entity's base URL.
    // If not specified, defaults to the entity's base URL with `role`
    // appended. If the value includes a leading '/', it is appended directly
    // to the base URL. If it does not include a leading '/', a '/' is
    // inserted between the base URL and the urlPath. If it's a complete URL,
    // that is with a leading `https://` or `http://`, it is used as-is.
    urlPath?: string;
    // Additional query parameters to be included in the request. This is in
    // addition to the query params specified in the CRUD's endpoint.
    params?: HttpParams;
    // Optional body for POST, PUT, PATCH requests
    body?: any;
  };

  /**
   * Custom handler function to be called when the action is triggered.
   * If provided, this function is called instead of the default handling
   * by the MatEntityCrud component. This property takes precedence over
   * `httpRequestParameters`.
   *
   * @param entity The entity on which the action is performed.
   */
  action?: (entity: TEntity) => void;
}
