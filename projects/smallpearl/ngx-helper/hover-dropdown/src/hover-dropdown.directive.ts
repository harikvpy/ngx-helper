import { Directive, ElementRef, input, OnInit } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';

/**
 * A directive to make a button triggered mat-menu open during mouse hover.
 * Use it like this:

      <button #menuTrigger="matMenuTrigger"
        mat-icon-button
        [matMenuTriggerFor]="children"
        hoverDropDown
        [menu]="children"
        [hoverTrigger]="menuTrigger">
        <mat-icon>menu</mat-icon>
      </button>
      <mat-menu #children="matMenu" hasBackdrop="false">
        <button mat-menu-item (click)="onEdit()">Edit</button>
        <button mat-menu-item (click)="onDelete()">Delete</button>
      </mat-menu>

  Note how hoverDropDown and [hoverTrigger] are used to wire up the button
  and the associated mat-menu to the directive. Once setup like this, the
  mat-menu will be opened whenever the mouse cursor hovers over the menu
  trigger button.

  Copied from:
  https://stackoverflow.com/questions/54301126/how-to-show-the-angular-material-drop-down-on-mouse-over
 */
@Directive({
  standalone: true,
  selector: '[hoverDropDown]',
})
export class HoverDropDownDirective implements OnInit {
  static _menuClicked = false;
  isInHoverBlock = false;

  constructor(private el: ElementRef) {}

  hoverTrigger = input<MatMenuTrigger|null>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu = input<any>();

  ngOnInit() {
    const ht = this.hoverTrigger();
    if (ht) {
      this.el.nativeElement.addEventListener('mouseenter', () => {
        if (HoverDropDownDirective._menuClicked) {
          // console.log(`menu clicked state set, ignoring mouse enter..`);
          return;
        }
        this.setHoverState(true);
        ht.openMenu();
        // KLUDGE!
        // this.menu._elementRef.nativeElement.className can return multiple
        // class names, delimited by a space. Use the first class as the
        // definitive selector for the menu. this could potentially fail in
        // new Angular Material versions if the MatMenu implementation changes.
        const openMenu = document.querySelector(
          `.mat-menu-after.${
            this.menu()._elementRef.nativeElement.className.split(' ')[0]
          }`
        );
        if (!openMenu) {
          ht.closeMenu();
          return;
        }
        openMenu.addEventListener('mouseenter', () => {
          this.setHoverState(true);
        });
        openMenu.addEventListener('mouseleave', () => {
          this.setHoverState(false);
        });
        openMenu.addEventListener('click', () => {
          // console.log(`menu clicked, setting state..`);
          HoverDropDownDirective._menuClicked = true;
          setTimeout(() => {
            // console.log(`menu clicked, clearing state..`);
            HoverDropDownDirective._menuClicked = false;
          }, 180);
        });
      });
      this.el.nativeElement.addEventListener('mouseleave', () => {
        this.setHoverState(false);
      });
    }
  }

  private setHoverState(isInBlock: boolean) {
    this.isInHoverBlock = isInBlock;
    if (!isInBlock) {
      this.checkHover();
    }
  }

  private checkHover() {
    setTimeout(() => {
      if (!this.isInHoverBlock && this.hoverTrigger()!.menuOpen) {
        this.hoverTrigger()!.closeMenu();
      }
    }, 50);
  }
}
