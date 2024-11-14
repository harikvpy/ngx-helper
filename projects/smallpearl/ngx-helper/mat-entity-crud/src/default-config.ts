import { inject } from "@angular/core";
import { SPMatEntityCrudConfig } from "./mat-entity-crud-types";
import { SP_MAT_ENTITY_CRUD_CONFIG } from "./providers";

export const DefaultSPMatEntityCrudConfig: SPMatEntityCrudConfig = {
  i18n: {
    newItemLabel: (itemLabel: string) => `New ${itemLabel}`,
    editItemLabel: (itemLabel: string) => `Edit ${itemLabel}`,
    edit: 'Edit',
    delete: 'Delete',
    deleteItemHeader: (itemLabel: string) => `Confirm Delete ${itemLabel}`,
    deleteItemMessage: (itemLabel: string) => `Are you sure you want to delete this ${itemLabel}`,
    itemDeletedNotification: (itemLabel: string) => `${itemLabel} deleted`,
    createdItemNotification: (itemLabel: string) => `${itemLabel} created.`,
    updatedItemNotification: (itemLabel: string) => `${ itemLabel } saved.`,
    loseChangesPrompt: 'OK to lose changes?'
  }
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
