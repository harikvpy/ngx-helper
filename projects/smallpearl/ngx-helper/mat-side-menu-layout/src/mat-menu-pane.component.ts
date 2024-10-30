import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  viewChildren
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { Subject, filter, takeUntil, tap } from 'rxjs';
import { LayoutService, SideMenuLayoutProps } from './layout.service';
import { SPMatMenuListItemComponent } from './mat-menu-list-item.component';
import { NavItem } from './nav-item';

@Component({
  selector: 'ngx-mat-menu-pane',
  template: `
    <div class="menu-pane-wrapper">
      <div class="sidenav-branding mat-toolbar-single-row">
        <div class="branding branding-logo">
          <img *ngIf="brandingImage" [src]="brandingImage" />
        </div>
        <h4 class="mat-typography branding branding-text">
          {{ brandingText }}
        </h4>
      </div>
      <div class="sidenav-menu">
        <div *ngIf="menuTitle" class="mat-body title">{{ menuTitle }}</div>
        <mat-nav-list>
          <ngx-mat-menu-list-item
            *ngIf="backButtonNavItem"
            [item]="backButtonNavItem"
          ></ngx-mat-menu-list-item>
          <ngx-mat-menu-list-item
            *ngFor="let item of menuItems"
            [item]="item"
            [showIcon]="showIcons"
          ></ngx-mat-menu-list-item>
        </mat-nav-list>
      </div>
      <div class="sidenav-version" *ngIf="menuPaneFooterContent">
        <ng-container *ngTemplateOutlet="menuPaneFooterContent"> </ng-container>
      </div>
    </div>
  `,
  styleUrls: ['./mat-menu-pane.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPMatMenuPaneComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() menuTitle: string = '';
  @Input() showBackButton: boolean = false;
  @Input() defaultBackButtonHref: string = '';
  @Input() backButtonText: string = 'BACK';
  @Input() menuItems: NavItem[] = [];
  @Input() brandingText: string = 'BRAND';
  @Input() brandingImage: string = '';
  @Input() matSideNav: MatSidenav | undefined;
  @Input() appVersion: string = '0.0';
  @Input() menuPaneFooterContent!: TemplateRef<any>;
  @Input() showIcons: boolean = true;
  layout!: SideMenuLayoutProps;

  backButtonNavItem: NavItem | undefined;
  destroy = new Subject<void>();

  menuItemComps = viewChildren(SPMatMenuListItemComponent);

  constructor(
    public cdr: ChangeDetectorRef,
    private layoutService: LayoutService,
    private router: Router
  ) {}

  ngOnInit() {
    this.layoutService.layoutChanged
      .pipe(
        takeUntil(this.destroy),
        tap((newLayout) => {
          // console.log(
          //   'Layout changed - new toolbar height:',
          //   newLayout.toolbarHeight
          // );
          this.layout = newLayout;
          this.cdr.detectChanges();
        })
      )
      .subscribe();

    if (this.showBackButton) {
      this.backButtonNavItem = {
        route: this.layoutService.previousUrl
          ? this.layoutService.previousUrl
          : this.defaultBackButtonHref,
        text: this.backButtonText,
        icon: 'arrow_back',
        backButton: true,
        backHref: window.history.state ? window.history.state['backHref'] : '#',
      };
      this.cdr.detectChanges();
    }

    this.router.events
      .pipe(
        takeUntil(this.destroy),
        filter((e) => e instanceof NavigationEnd),
        tap((e: RouterEvent) => {
          if (this.matSideNav && this.layout.smallScreen) {
            this.matSideNav.close();
          }
          const ne = e as NavigationEnd;
          this.highlightCurrentUrlMenuItem(ne.urlAfterRedirects);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['backButtonText']) {
      if (this.backButtonNavItem) {
        this.backButtonNavItem = {
          ...this.backButtonNavItem,
          text: this.backButtonText,
        };
        this.cdr.detectChanges();
      }
    }
  }

  ngAfterViewInit(): void {
    this.highlightCurrentUrlMenuItem(this.router.routerState.snapshot.url);
  }

  highlightCurrentUrlMenuItem(url: string) {
    const urlParts = url.split('/');
    const lastUrlSegment = urlParts[urlParts.length-1].split('?')[0];

    this.menuItemComps().find(menuItemComp => {
      if (menuItemComp.item.route?.endsWith(lastUrlSegment)) {
        menuItemComp.toggleHighlight(true);
      } else {
        menuItemComp.toggleHighlight(false);
        if (menuItemComp.item?.children) {
          if (menuItemComp.checkChildrenForHighlight(lastUrlSegment)) {
            menuItemComp.expand();
          };
        }
      }
    });
  }
}
