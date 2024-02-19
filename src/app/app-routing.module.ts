import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home-page/home-page.component').then(
        (m) => m.HomePageComponent
      ),
  },
  {
    path: 'layout',
    loadChildren: () =>
      import('./side-menu-layout-example/side-menu-layout-example.module').then(
        (m) => m.SideMenuLayoutExampleModule
      ),
    // loadComponent: () =>
    //   import(
    //     './side-menu-layout-example/side-menu-layout-example.component'
    //   ).then((c) => c.SideMenuLayoutExampleComponent),
    // loadChildren: () => import('./side-menu-layout-example/child-routes'),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
