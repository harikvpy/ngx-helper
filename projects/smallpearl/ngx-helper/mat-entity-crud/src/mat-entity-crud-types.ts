/**
 * Global config for SPMatEntityList component.
 */
export interface SPMatEntityCrudConfig {
  i18n: {
    newItemLabel: (itemLabel: string) => string;
    editItemLabel: (itemLabel: string) => string;
    edit: string;
    delete: string;
    deleteItemHeader: string;
    deleteItemMessage: string;
    itemDeletedNotification: string;
  }
  i18nTranslate?: (label: string, context?: any) => string;
}

