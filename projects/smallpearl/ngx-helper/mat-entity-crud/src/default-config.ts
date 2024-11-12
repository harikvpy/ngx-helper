import { SPMatEntityCrudConfig } from "./mat-entity-crud-types";

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
    updatedItemNotification: (itemLabel: string) => `${ itemLabel } saved.`
  }
};

export function getConfig(userConfig: SPMatEntityCrudConfig): SPMatEntityCrudConfig {
  return {
    ...DefaultSPMatEntityCrudConfig,
    ...(userConfig ? userConfig : {}),
  };
}
