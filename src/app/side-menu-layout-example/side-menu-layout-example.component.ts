import { Component, OnInit, ViewChild } from '@angular/core';
import { NavItem } from '@smallpearl/ngx-helper/mat-menu-list-item/src/nav-item';
import { QQMatSideMenuLayoutComponent } from '@smallpearl/ngx-helper/mat-side-menu-layout/src/mat-side-menu-layout.component';

@Component({
  selector: 'app-side-menu-layout-eample',
  template: `
    <qq-mat-side-menu-layout
      brandingImage="assets/angular.png"
      brandingText="SMALLPEARL"
      appTitle="QQBOOKS"
      contentContainerClass="ex-content-container"
      [menuItems]="menuItems"
      [menuPaneFooterContent]="versionInfoFooter"
      [toolbarEndContent]="toolbarEndContent"
      [infoPaneContent]="infoPaneContent"
      [infoPaneMinWidth]="300"
      [infoPaneMaxWidth]="500"
      [toolbarTitleContent]="toolbarTitle"
      #layout
    ></qq-mat-side-menu-layout>
    <ng-template #versionInfoFooter>
      <app-sidemenu-footer></app-sidemenu-footer>
    </ng-template>
    <ng-template #toolbarTitle>
      <app-toolbar-title></app-toolbar-title>
    </ng-template>
    <ng-template #toolbarEndContent>
      <app-toolbar-end-buttons
        [sideMenuLayout]="layout"
      ></app-toolbar-end-buttons>
    </ng-template>
    <ng-template #infoPaneContent>
      <app-sidemenu-info-pane></app-sidemenu-info-pane>
    </ng-template>
  `,
  styles: [],
})
export class SideMenuLayoutExampleComponent implements OnInit {
  @ViewChild(QQMatSideMenuLayoutComponent)
  sideMenuLayout!: QQMatSideMenuLayoutComponent;

  menuItems: NavItem[] = [
    {
      route: 'posts',
      displayName: 'ANNOUNCEMENTS',
      iconName: 'post_add',
    },
    {
      route: 'feedback',
      displayName: 'FEEDBACK',
      iconName: 'edit_square',
    },
    {
      displayName: 'MEMBERS',
      iconName: 'people',
      children: [
        {
          route: 'allmembers',
          displayName: 'ALL MEMBERS',
          iconName: 'people_alt',
        },
        {
          route: 'invitations',
          displayName: 'INVITATIONS',
          iconName: 'email',
        },
      ],
    },
    {
      route: './satellite-app',
      displayName: 'SATELLITE APP',
      iconName: 'token',
    },
  ];

  constructor() {}

  ngOnInit() {}
}
