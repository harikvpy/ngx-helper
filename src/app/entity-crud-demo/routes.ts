import { Routes } from "@angular/router";
import { CreateEditEntityDemoComponent } from "./create-edit-entity-demo.component";
import { canDeactivateSPMatEntityCrudHost } from "./can-deactivate";

export const CRUD_DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./entity-crud-demo.component').then(c => c.EntityCrudDemoComponent),
    canDeactivate: [canDeactivateSPMatEntityCrudHost]
  },
  {
    path: 'new',
    loadComponent: () => import('./create-edit-entity-demo.component').then(c => CreateEditEntityDemoComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./create-edit-entity-demo.component').then(c => CreateEditEntityDemoComponent)
  }
]
