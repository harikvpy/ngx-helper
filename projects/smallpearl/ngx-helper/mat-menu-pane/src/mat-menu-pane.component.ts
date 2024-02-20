import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, filter, takeUntil, tap } from 'rxjs';
import { SideMenuLayoutProps, LayoutService } from './layout.service';
import { NavigationEnd, Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import {
  QQMatMenuListItemComponent,
  NavItem,
} from '@smallpearl/ngx-helper/mat-menu-list-item';

@Component({
  selector: 'qq-mat-menu-pane',
  template: `
    <div class="menu-pane-wrapper">
      <div class="sidenav-branding mat-toolbar-single-row">
        <div class="branding branding-logo">
          <img *ngIf="brandingImage" [src]="brandingImage" />
        </div>
        <h4 class="branding branding-text">
          {{ brandingText }}
        </h4>
      </div>
      <div class="sidenav-menu">
        <div *ngIf="title" class="title">{{ title }}</div>
        <mat-nav-list>
          <qq-mat-menu-list-item
            *ngIf="backButtonNavItem"
            [item]="backButtonNavItem"
          ></qq-mat-menu-list-item>
          <qq-mat-menu-list-item
            *ngFor="let item of menuItems"
            [item]="item"
          ></qq-mat-menu-list-item>
        </mat-nav-list>
      </div>
      <div class="sidenav-version" *ngIf="menuPaneFooterContent">
        <ng-container *ngTemplateOutlet="menuPaneFooterContent"> </ng-container>
      </div>
    </div>
  `,
  styleUrls: ['./mat-menu-pane.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    QQMatMenuListItemComponent,
  ],
})
export class QQMatMenuPaneComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() showBackButton: boolean = false;
  @Input() defaultBackButtonHref: string = '';
  @Input() menuItems: NavItem[] = [];
  @Input() brandingText: string = 'BRAND';
  @Input() brandingImage: string = '';
  @Input() matSideNav: MatSidenav | undefined;
  @Input() appVersion: string = '0.0';
  @Input() menuPaneFooterContent!: TemplateRef<any>;
  layout!: SideMenuLayoutProps;

  backButtonNavItem: NavItem | undefined;
  destroy = new Subject<void>();

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
        displayName: 'BACK',
        iconName: 'arrow_back',
        backButton: true,
        backHref: window.history.state['backHref'],
      };
      this.cdr.detectChanges();
    }

    this.router.events
      .pipe(
        takeUntil(this.destroy),
        filter((e) => e instanceof NavigationEnd),
        tap(() => {
          if (this.matSideNav && this.layout.smallScreen) {
            this.matSideNav.close();
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }
}
