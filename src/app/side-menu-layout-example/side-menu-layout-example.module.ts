import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Routes } from '@angular/router';
import { QQMatSideMenuLayoutComponent } from '@smallpearl/ngx-helper/mat-side-menu-layout';
import { SidemenuFooterComponent } from '../components/sidemenu-footer/sidemenu-footer.component';
import { SidemenuInfoPaneComponent } from '../components/sidemenu-info-pane/sidemenu-info-pane.component';
import { ToolbarEndButtonsComponent } from '../components/toolbar-end-buttons/toolbar-end-buttons.component';
import { ToolbarTitleComponent } from '../components/toolbar-title/toolbar-title.component';
import { SideMenuLayoutExampleComponent } from './side-menu-layout-example.component';

const routes: Routes = [
  {
    path: '',
    component: SideMenuLayoutExampleComponent,
    children: [
      {
        path: 'posts',
        loadComponent: () =>
          import('../posts/posts.component').then((m) => m.PostsComponent),
      },
      {
        path: 'feedback',
        loadComponent: () =>
          import('../feedback/feedback.component').then(
            (m) => m.FeedbackComponent
          ),
      },
      {
        path: 'allmembers',
        loadComponent: () =>
          import('../all-members/all-members.component').then(
            (m) => m.AllMembersComponent
          ),
      },
      {
        path: 'invitations',
        loadComponent: () =>
          import('../invitations/invitations.component').then(
            (m) => m.InvitationsComponent
          ),
      },
      {
        path: '',
        redirectTo: 'posts',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'satellite-app',
    loadChildren: () =>
      import('../satellite-app-home/satellite-app-home.module').then(
        (m) => m.SatelliteAppHomeModule
      ),
  },
];

@NgModule({
  imports: [
    QQMatSideMenuLayoutComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    SidemenuFooterComponent,
    SidemenuInfoPaneComponent,
    ToolbarTitleComponent,
    ToolbarEndButtonsComponent,
    RouterModule.forChild(routes),
  ],
  exports: [],
  declarations: [SideMenuLayoutExampleComponent],
  providers: [],
})
export class SideMenuLayoutExampleModule {}
