import { Component, OnInit, ViewChild } from '@angular/core';
import { NavItem, SPMatMenuLayoutComponent } from '@smallpearl/ngx-helper/mat-side-menu-layout';

@Component({
  selector: 'app-side-menu-layout-eample',
  template: `
    <sp-mat-menu-layout
      baseUrl="home"
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
      #layout
    ></sp-mat-menu-layout>
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
  @ViewChild(SPMatMenuLayoutComponent) sideMenuLayout!: SPMatMenuLayoutComponent;
  menuItems: NavItem[] = [
    {
      route: 'posts',
      text: 'ANNOUNCEMENTS',
      icon: 'post_add',
    },
    {
      route: 'feedback',
      text: 'FEEDBACK',
      icon: 'edit_square',
    },
    {
      text: 'MEMBERS',
      icon: 'people',
      children: [
        {
          route: 'allmembers',
          text: 'ALL MEMBERS',
          icon: 'people_alt',
        },
        {
          route: 'invitations',
          text: 'INVITATIONS',
          icon: 'email',
        },
      ],
    },
    {
      route: 'satellite-app',
      text: 'SATELLITE APP',
      icon: 'token',
    },
    {
      route: 'i18ntest',
      text: 'I18N TEST',
      icon: 'language'
    },
    {
      route: 'entitylistdemo',
      text: 'ENTITY LIST',
      icon: 'list_alt',
    },
    {
      route: 'entitycruddemo',
      text: 'ENTITY CRUD',
      icon: 'list_alt',
    },
    {
      route: 'busywheeldemo',
      text: 'BUSY WHEEL DEMO',
      icon: 'hourglass_empty'
    }
  ];

  constructor() {}

  ngOnInit() {}
}
