import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { QQMatSideMenuLayoutComponent } from '@smallpearl/ngx-helper/mat-side-menu-layout';
import { SideMenuLayoutExampleComponent } from './side-menu-layout-example.component';

@NgModule({
  imports: [
    QQMatSideMenuLayoutComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule.forChild([
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
    ]),
  ],
  exports: [],
  declarations: [SideMenuLayoutExampleComponent],
  providers: [],
})
export class SideMenuLayoutExampleModule {}
