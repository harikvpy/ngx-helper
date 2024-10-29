import { Routes } from "@angular/router";
import { CreateEntityDemoComponent } from "./create-entity.component";

export const CRUD_DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./entity-crud-demo.component').then(c => c.EntityCrudDemoComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./create-entity.component').then(c => CreateEntityDemoComponent)
  }
]
