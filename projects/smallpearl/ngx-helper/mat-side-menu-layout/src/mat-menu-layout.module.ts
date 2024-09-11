import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { RouterOutlet } from '@angular/router';
import { SPMatMenuLayoutComponent } from './mat-menu-layout.component';
import { SPMatMenuListItemComponent } from './mat-menu-list-item.component';
import { SPMatMenuPaneComponent } from './mat-menu-pane.component';

@NgModule({
  declarations: [SPMatMenuPaneComponent, SPMatMenuListItemComponent, SPMatMenuLayoutComponent],
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatListModule
  ],
  exports: [SPMatMenuPaneComponent, SPMatMenuListItemComponent, SPMatMenuLayoutComponent],
})
export class SPMatMenuLayoutModule {}
