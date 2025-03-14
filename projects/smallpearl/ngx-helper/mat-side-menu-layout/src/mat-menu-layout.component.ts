import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Subject, takeUntil, tap } from 'rxjs';
import { LayoutService, SideMenuLayoutProps } from './layout.service';
import { NavItem } from './nav-item';

@Component({
    selector: 'sp-mat-menu-layout',
    template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav
        class="layout-menu-pane"
        opened
        #menuNav
        [mode]="layout.smallScreen ? 'over' : 'side'"
        [opened]="!layout.smallScreen"
        [fixedInViewport]="layout.smallScreen"
      >
        <div class="layout-menu-container">
          <ngx-mat-menu-pane
            [baseUrl]="baseUrl"
            [showBackButton]="showBackButton"
            [showIcons]="showIcons"
            [defaultBackButtonHref]="defaultBackButtonHref"
            [backButtonText]="backButtonText"
            [brandingImage]="brandingImage"
            [brandingText]="brandingText"
            [menuItems]="menuItems"
            [matSideNav]="menuNav"
            [menuPaneFooterContent]="menuPaneFooterContent"
            [menuTitle]="menuTitle"
            class="h-100"
          ></ngx-mat-menu-pane>
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

      <mat-sidenav-content class="layout-content">
        <mat-toolbar class="layout-content-toolbar">
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
        <div class="layout-content-content" [class]="contentContainerClass">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
    styles: [
        `
      .layout-menu-pane {
        background-color: var(--sp-mat-menu-bg-color) !important;
        color: var(--sp-mat-menu-fg-color) !important;
      }
      .layout-container {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
      .layout-menu-container {
        height: 100%;
        max-width: var(--sp-mat-menu-sidemenu-max-width, 50%);
        min-width: var(--sp-mat-menu-sidemenu-min-width, 250px);
        text-wrap: nowrap;
        overflow-x: scroll;
        overflow-y: scroll;
      }
      .layout-content {
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow-x: clip;
      }
      .layout-content-toolbar {
        border-bottom: 1px solid var(--sp-mat-menu-toolbar-border-color);
        flex-grow: 0;
        background-color: var(--sp-mat-menu-toolbar-bg-color);
        color: var(--sp-mat-menu-toolbar-fg-color);
        padding: 0 0;
        min-height: var(--mat-toolbar-standard-height);
        max-height: var(--mat-toolbar-standard-height);
      }
      .layout-content-content {
        flex-grow: 1;
        overflow: hidden;
      }
      .h-100 {
        height: 100%;
      }
      .spacer {
        flex: 1 1 auto;
      }
    `,
    ],
    // Add this style to make the content-container scroll from within.
    // That is override the window scrolling with the content div private
    // scroller.
    // .content-container {
    //   overflow-x: scroll;
    //   overflow-y: scroll;
    // }
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SPMatMenuLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('menuNav') menuNav!: MatSidenav;
  layout!: SideMenuLayoutProps;
  destroy = new Subject<void>();
  containerHeight: number = 500;
  topBottomPadding: number = 6;
  @Input() baseUrl = '';
  @Input() showBackButton: boolean = false;
  @Input() defaultBackButtonHref: string = '';
  @Input() backButtonText: string = 'BACK';
  @Input() brandingImage: string = '';
  @Input() brandingText: string = '';
  @Input() appTitle: string = '';
  @Input() menuTitle: string = '';
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
  @Input() showIcons: boolean = true;
  // Allows querying infoPane to activate it or to set its attributes
  @ViewChild('infoPane') readonly infoPane!: MatSidenav;

  constructor(
    private layoutService: LayoutService,
    private cdr: ChangeDetectorRef
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
          this.cdr.detectChanges();
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
