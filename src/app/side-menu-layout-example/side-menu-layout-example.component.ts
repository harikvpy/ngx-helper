import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NavItem } from '@smallpearl/ngx-helper/mat-menu-list-item/nav-item';
import { SideMenuLayoutComponent } from '@smallpearl/ngx-helper/side-menu-layout/side-menu-layout.component';

@Component({
  selector: 'app-side-menu-layout-eample',
  template: `
    <qq-side-menu-layout
      brandingImage="assets/angular.png"
      brandingText="SMALLPEARL"
      title="QQBOOKS"
      [menuItems]="menuItems"
      [menuPaneFooter]="versionInfoFooter"
      [toolbarRightButtons]="toolbarRightButtons"
      [infoPaneContent]="infoPaneContent"
      [infoPaneMinWidth]="300"
      [infoPaneMaxWidth]="500"
    ></qq-side-menu-layout>
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
    <ng-template #toolbarRightButtons>
      <button mat-icon-button>
        <mat-icon>swap_horiz</mat-icon>
      </button>
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
    `,
  ],
  standalone: true,
  imports: [
    SideMenuLayoutComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
})
export class SideMenuLayoutExampleComponent implements OnInit {
  @ViewChild(SideMenuLayoutComponent) sideMenuLayout: SideMenuLayoutComponent;

  menuItems: NavItem[] = [
    {
      route: 'layout2/posts',
      displayName: 'Announcements',
      iconName: 'post_add',
    },
    {
      route: 'layout2/feedback',
      displayName: 'Feedback',
      iconName: 'post_add',
    },
    {
      route: 'layout2/posts',
      displayName: 'Contacts',
      iconName: 'post_add',
    },
    {
      route: 'layout2/feedback',
      displayName: 'Documents',
      iconName: 'post_add',
    },
    {
      route: 'layout2/posts',
      displayName: 'Amenities',
      iconName: 'refresh',
    },
    {
      route: 'layout2/feedback',
      displayName: 'Members',
      iconName: 'people',
    },
    {
      route: 'layout2/posts',
      displayName: 'Groups',
      iconName: 'shield',
    },
    {
      route: 'layout2/feedback',
      displayName: 'Parcels',
      iconName: 'person',
    },
    {
      route: 'layout2/feedback',
      displayName: 'Settings',
      iconName: 'settings',
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
