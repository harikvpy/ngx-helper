import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NavItem } from '@smallpearl/ngx-helper/mat-menu-list-item/src/nav-item';
import { QQMatSideMenuLayoutComponent } from '@smallpearl/ngx-helper/mat-side-menu-layout/src/mat-side-menu-layout.component';

@Component({
  selector: 'app-side-menu-layout-eample',
  template: `
    <qq-mat-side-menu-layout
      brandingImage="assets/angular.png"
      brandingText="SMALLPEARL"
      appTitle="QQBOOKS"
      [menuItems]="menuItems"
      [menuPaneFooterContent]="versionInfoFooter"
      [toolbarEndContent]="toolbarEndContent"
      [infoPaneContent]="infoPaneContent"
      [infoPaneMinWidth]="300"
      [infoPaneMaxWidth]="500"
      [toolbarTitleContent]="toolbarTitle"
    ></qq-mat-side-menu-layout>
    <ng-template #versionInfoFooter>
      <div style="text-align: center; font-size: 0.8em;">
        <select name="language" id="language">
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
        <br />
        <small>2.3.102</small>
      </div>
    </ng-template>
    <ng-template #toolbarTitle>
      <button mat-button [matMenuTriggerFor]="otherCommunitiesMenu">
        <h4 class="community-name">Signature Park</h4>
        <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
      </button>
      <mat-menu #otherCommunitiesMenu="matMenu">
        <button mat-menu-item>Cavenagh Garden</button>
        <button mat-menu-item>Cashew Heights</button>
      </mat-menu>
    </ng-template>
    <ng-template #toolbarEndContent>
      <button mat-icon-button (click)="onNotificationsToggle()">
        <mat-icon>notifications</mat-icon>
      </button>
      <button
        mat-icon-button
        class="user-button"
        [matMenuTriggerFor]="userProfileMenu"
      >
        <img src="assets/avatar.jpg" alt="" />
      </button>
      <mat-menu #userProfileMenu="matMenu">
        <button mat-menu-item (click)="onUpdateProfile()">
          <mat-icon>face</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item (click)="onChangePassword()">
          <mat-icon>password</mat-icon>
          <span>Change password</span>
        </button>
        <button mat-menu-item (click)="onSignOut()">
          <mat-icon>logout</mat-icon>
          <span>Sign out</span>
        </button>
      </mat-menu>
    </ng-template>
    <ng-template #infoPaneContent>
      <div class="info-pane-content">
        <h2>Notifications</h2>
        <p>Info pane content!</p>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .user-button {
        background: none;
        padding: 0;
        border: 0;
        cursor: pointer;
      }
      .user-button img {
        margin-top: 5px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
      }
      .info-pane-content {
        padding: 10px;
      }
      .community-name {
        font-size: 1.5em;
        font-weight: 800;
      }
    `,
  ],
  standalone: true,
  imports: [
    QQMatSideMenuLayoutComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
})
export class SideMenuLayoutExampleComponent implements OnInit {
  @ViewChild(QQMatSideMenuLayoutComponent)
  sideMenuLayout!: QQMatSideMenuLayoutComponent;

  menuItems: NavItem[] = [
    {
      route: '/layout2/posts',
      displayName: 'Announcements',
      iconName: 'post_add',
    },
    {
      route: '/layout2/feedback',
      displayName: 'Feedback',
      iconName: 'post_add',
    },
    {
      route: '/layout2/members',
      displayName: 'Members',
      iconName: 'people',
      children: [
        {
          route: '/layout2/members/allmembers',
          displayName: 'All Members',
          iconName: 'people_alt',
        },
      ],
    },
  ];

  constructor() {}

  ngOnInit() {}

  onNotificationsToggle() {
    if (this.sideMenuLayout) {
      this.sideMenuLayout.infoPane.toggle();
    }
  }

  onUpdateProfile() {
    console.log('onUpdateProfile');
  }
  onChangePassword() {
    console.log('onChangePassword');
  }
  onSignOut() {
    console.log('OnSignOut');
  }
}
