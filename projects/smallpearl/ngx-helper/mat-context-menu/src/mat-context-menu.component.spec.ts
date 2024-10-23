import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ContextMenuItem, SPMatContextMenuComponent } from './mat-context-menu.component';

describe('SPMatContextMenuComponent', () => {
  let fixture!: ComponentFixture<SPMatContextMenuComponent>;
  let component!: SPMatContextMenuComponent;
  let componentRef!: ComponentRef<SPMatContextMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SPMatContextMenuComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(SPMatContextMenuComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('label', 'More');
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
  })

  it('should show menu items on click', async () => {
    const menuItems: ContextMenuItem[] = [
      {
        label: 'Edit',
      },
      {
        label: 'Delete',
      },
    ]
    componentRef.setInput('menuItems', menuItems);
    fixture.detectChanges()
    const items = fixture.debugElement.nativeElement.querySelectorAll('button');
    items[0].click();
    await new Promise(res => setTimeout(res, 100));
    const menuButtons = document.querySelectorAll('button.mat-mdc-menu-item');
    expect(menuButtons.length).toEqual(menuItems.length);
  });
});
