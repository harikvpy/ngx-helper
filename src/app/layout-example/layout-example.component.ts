import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet, Routes } from '@angular/router';
import { NavItem } from '@smallpearl/ngx-helper/mat-menu-list-item/src/nav-item';
import {
  SideMenuLayoutProps,
  LayoutService,
} from '@smallpearl/ngx-helper/mat-menu-pane/src/layout.service';
import { QQMatMenuPaneComponent } from '@smallpearl/ngx-helper/mat-menu-pane/src/mat-menu-pane.component';
import { Subject, takeUntil, tap } from 'rxjs';

// const routes: Routes = [
//   {
//     path: '',
//     component: LayoutExampleComponent,
//     loadChildren: () => import('./child-routes').then(m => m.CHILD_ROUTES)
//   }
// ]

@Component({
  selector: 'app-layout-example',
  template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav
        mode="side"
        opened
        #menuNav
        [mode]="layout.smallScreen ? 'over' : 'side'"
        [opened]="!layout.smallScreen"
        [fixedInViewport]="layout.smallScreen"
      >
        <div class="sidenav-container mw-192px">
          <qq-mat-menu-pane
            brandingImage="assets/angular.png"
            brandingText="QQBOOKS"
            [menuItems]="menuItems"
            [matSideNav]="menuNav"
            class="h-100"
          ></qq-mat-menu-pane>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar class="app-toolbar">
          <button mat-icon-button (click)="onToggleMenuPane()">
            <mat-icon>menu</mat-icon>
          </button>
        </mat-toolbar>
        <div class="content-container">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .layout-container {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
      .sidenav-container {
        height: 100%;
        max-width: 250px;
        text-wrap: nowrap;
        overflow-x: scroll;
        overflow-y: scroll;
      }
      .content-container {
        height: 100%;
        overflow-x: scroll;
        overflow-y: scroll;
      }
      .h-100 {
        height: 100%;
      }
      .mw-192px {
        min-width: 192px;
      }
      .app-toolbar {
        border-bottom: 1px solid lightgray;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    QQMatMenuPaneComponent,
  ],
})
export class LayoutExampleComponent implements OnInit, OnDestroy {
  @ViewChild('menuNav') menuNav: MatSidenav;
  layout: SideMenuLayoutProps;
  destroy = new Subject<void>();

  menuItems: NavItem[] = [
    {
      route: 'layout/posts',
      displayName: 'Posts that are very wide for one line',
      iconName: 'post_add',
    },
    {
      route: 'layout/feedback',
      displayName: 'Feedback',
      iconName: 'post_add',
    },
  ];

  constructor(
    private layoutService: LayoutService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.layoutService.layoutChanged
      .pipe(
        takeUntil(this.destroy),
        tap((newLayout: SideMenuLayoutProps) => {
          this.layout = newLayout;
          this.changeDetectorRef.detectChanges();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  onToggleMenuPane() {
    if (this.menuNav) {
      this.menuNav.toggle();
    }
  }
}
