import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SatelliteAppHomeComponent } from './satellite-app-home.component';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SidemenuFooterComponent } from '../components/sidemenu-footer/sidemenu-footer.component';
import { SidemenuInfoPaneComponent } from '../components/sidemenu-info-pane/sidemenu-info-pane.component';
import { ToolbarEndButtonsComponent } from '../components/toolbar-end-buttons/toolbar-end-buttons.component';
import { ToolbarTitleComponent } from '../components/toolbar-title/toolbar-title.component';
import { SPMatMenuLayoutComponent, SPMatMenuLayoutModule } from '@smallpearl/ngx-helper/mat-side-menu-layout';

const routes: Routes = [
  {
    path: '',
    component: SatelliteAppHomeComponent,
    children: [
      {
        path: 'flights',
        loadComponent: () =>
          import('./flights/flights.component').then((c) => c.FlightsComponent),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./bookings/bookings.component').then(
            (c) => c.BookingsComponent
          ),
      },
      {
        path: '',
        redirectTo: 'flights',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  declarations: [SatelliteAppHomeComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    SPMatMenuLayoutModule,
    SidemenuFooterComponent,
    SidemenuInfoPaneComponent,
    ToolbarTitleComponent,
    ToolbarEndButtonsComponent,
    RouterModule.forChild(routes),
  ],
})
export class SatelliteAppHomeModule {}
