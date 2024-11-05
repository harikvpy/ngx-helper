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
  },
  i18nTranslate: (label: string, context?: any) => {
    let XlatedString = label;
    if (context) {
      for (const key in context) {
        const value = context[key];
        if (value) {
          const re = new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}');
          XlatedString = XlatedString.replace(re, value);
        }
      }
    }
    return XlatedString;
  },
};

export function getConfig(userConfig: SPMatEntityCrudConfig): SPMatEntityCrudConfig {
  return {
    ...DefaultSPMatEntityCrudConfig,
    ...(userConfig ? userConfig : {}),
  };
}
