import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil, tap } from 'rxjs';
import { NavItem } from '@smallpearl/ngx-helper/mat-menu-list-item';
import {
  QQMatMenuPaneComponent,
  LayoutService,
  SideMenuLayoutProps,
} from '@smallpearl/ngx-helper/mat-menu-pane';

@Component({
  selector: 'qq-mat-side-menu-layout',
  template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav
        class="menu-pane"
        mode="side"
        opened
        #menuNav
        [mode]="layout.smallScreen ? 'over' : 'side'"
        [opened]="!layout.smallScreen"
        [fixedInViewport]="layout.smallScreen"
      >
        <div class="sidenav-container mw-192px">
          <qq-mat-menu-pane
            [showBackButton]="showBackButton"
            [defaultBackButtonHref]="defaultBackButtonHref"
            [brandingImage]="brandingImage"
            [brandingText]="brandingText"
            [menuItems]="menuItems"
            [matSideNav]="menuNav"
            [menuPaneFooterContent]="menuPaneFooterContent"
            class="h-100"
          ></qq-mat-menu-pane>
        </div>
      </mat-sidenav>

      <mat-sidenav
        [ngStyle]="{
          'min-width.px': infoPaneMinWidth,
          'max-width.px': infoPaneMaxWidth
        }"
        #infoPane
        closed
        mode="over"
        position="end"
      >
        <ng-container *ngTemplateOutlet="infoPaneContent"></ng-container>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="app-toolbar">
          <button mat-icon-button (click)="onToggleMenuPane()">
            <mat-icon>menu</mat-icon>
          </button>
          <ng-template #defaultToolbarTitle>
            <h4>{{ appTitle }}</h4>
          </ng-template>
          <ng-container
            *ngTemplateOutlet="
              toolbarTitleContent ? toolbarTitleContent : defaultToolbarTitle
            "
          ></ng-container>
          <span class="spacer"></span>
          <ng-container *ngTemplateOutlet="toolbarEndContent"></ng-container>
        </mat-toolbar>
        <div
          [class]="'content-container ' + contentContainerClass"
          [ngStyle]="{
            'height.px': containerHeight,
          }"
        >
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .menu-pane {
        background-color: var(--qq-sidenav-bg-color) !important;
        color: var(--qq-sidenav-fg-color) !important;
      }
      mat-toolbar {
        background-color: var(--qq-toolbar-bg-color);
        color: var(--qq-toolbar-fg-color);
      }
      mat-toolbar {
        padding: 0 0;
      }
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
        border-bottom: 1px solid var(--qq-toolbar-border-color);
      }
      .spacer {
        flex: 1 1 auto;
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
export class QQMatSideMenuLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('menuNav') menuNav!: MatSidenav;
  layout!: SideMenuLayoutProps;
  destroy = new Subject<void>();
  containerHeight: number = 500;
  topBottomPadding: number = 6;
  @Input() showBackButton: boolean = false;
  @Input() defaultBackButtonHref: string = '';
  @Input() brandingImage: string = '';
  @Input() brandingText: string = '';
  @Input() appTitle: string = '';
  @Input() menuItems: NavItem[] = [];
  // Template Partials for configurable portions of the layout
  @Input() menuPaneFooterContent!: TemplateRef<any>;
  @Input() toolbarEndContent!: TemplateRef<any>;
  @Input() infoPaneContent!: TemplateRef<any>;
  @Input() toolbarTitleContent!: TemplateRef<any>;
  // Width of the info pane on the right (or left for LTR) of the screen.
  @Input() infoPaneMinWidth: number = 250;
  @Input() infoPaneMaxWidth: number = 400;
  @Input() contentContainerClass: string = '';
  // Allows querying infoPane to activate it or to set its attributes
  @ViewChild('infoPane') infoPane!: MatSidenav;

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
          this.containerHeight =
            window.innerHeight -
            (newLayout.toolbarHeight + this.topBottomPadding * 2);
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
