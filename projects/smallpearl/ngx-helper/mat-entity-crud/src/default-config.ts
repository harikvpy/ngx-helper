import { inject } from "@angular/core";
import { SPMatEntityCrudConfig } from "./mat-entity-crud-types";
import { SP_MAT_ENTITY_CRUD_CONFIG } from "./providers";

function defaultCrudResponseParser(
  entityName: string,
  idKey: string,
  method: string, // 'create' | 'retrieve' | 'update' | 'delete',
  resp: any
) {
  // If the response is an object with a property '<idKey>', return it as
  // TEntity.
  if (resp.hasOwnProperty(idKey)) {
    return resp;
  }
  // If the response has an object indexed at '<entityName>' and it has
  // the property '<idKey>', return it as TEntity.
  if (resp.hasOwnProperty(entityName)) {
    const obj = resp[entityName];
    if (obj.hasOwnProperty(idKey)) {
      return obj;
    }
  }
  // Return undefined, indicating that we could't parse the response.
  return undefined;
}

export const DefaultSPMatEntityCrudConfig: SPMatEntityCrudConfig = {
  crudOpResponseParser: defaultCrudResponseParser
};

/**
 * To be called from an object constructor as it internally calls Angular's
 * inject() API.
 * @param userConfig
 * @returns
 */
export function getEntityCrudConfig(): SPMatEntityCrudConfig {
  const userCrudConfig = inject(SP_MAT_ENTITY_CRUD_CONFIG, {
    optional: true,
  });
  return {
    ...DefaultSPMatEntityCrudConfig,
    ...(userCrudConfig ?? {}),
  };
}
