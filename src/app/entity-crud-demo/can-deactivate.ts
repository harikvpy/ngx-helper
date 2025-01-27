export interface SPMatEntityCrudCanDeactivate {
  canDeactivate(): boolean;
}

export function canDeactivateSPMatEntityCrudHost(component: any): boolean {
  if (component?.canDeactivate) {
    return component.canDeactivate();
  }
  return true;
}
