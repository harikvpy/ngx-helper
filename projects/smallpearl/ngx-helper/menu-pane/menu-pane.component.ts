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
import { MenuListItemComponent } from '../mat-menu-list-item/mat-menu-list-item.component';
import { NavItem } from '../mat-menu-list-item/nav-item';

@Component({
  selector: 'qq-menu-pane',
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
      <div class="sidenav-version">
        <ng-container *ngTemplateOutlet="menuPaneFooter"> </ng-container>
      </div>
    </div>
  `,
  styleUrls: ['./menu-pane.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MenuListItemComponent,
  ],
})
export class MenuPaneComponent implements OnInit, OnDestroy {
  @Input() title: string;
  @Input() backButtonHref: string = '';
  @Input() menuItems: NavItem[];
  @Input() brandingText: string = 'BRAND';
  @Input() brandingImage: string = '';
  @Input() matSideNav: MatSidenav;
  @Input() appVersion: string = '0.0';
  @Input() menuPaneFooter: TemplateRef<any>;
  layout: SideMenuLayoutProps;

  backButtonNavItem: NavItem;
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

    if (this.backButtonHref) {
      this.backButtonNavItem = {
        route: this.layoutService.previousUrl
          ? this.layoutService.previousUrl
          : this.backButtonHref,
        displayName: 'back',
        iconName: 'arrow_back',
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
