import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { SPMatBusyWheelComponent } from './busy-wheel.component';
import { SPMatHostBusyWheelDirective } from './host-busy-wheel.directive';

const BACKDROP_DIV_ID = 'id_busy-wheel-backdrop';
const BUSY_WHEEL_DIV_ID = 'id_busy-wheel';

// TODO: Replace busy-wheel with <mat-spinner>
// <mat-spinner diameter="32"></mat-spinner>
const BUSY_WHEEL_FRAGMENT_TEMPLATE = `
<div id="{wheelId}">
  <div class="{containerClass}">
    <div class="busy-wheel"></div>
  </div>
</div>
`;

interface StyleInfo {
  style: string;
  value:string|number;
};

interface WheelData {
  component: ComponentRef<SPMatBusyWheelComponent>;
  oldStyles: Array<{style: string, value:string|number}>;
}

@Injectable({ providedIn: 'root' })
export class BusyWheelService {

  private defaultBusyWheelDir!: SPMatHostBusyWheelDirective;
  private namedBusyWheelDirs = new Map<string, Array<SPMatHostBusyWheelDirective>>();
  private wheelComponents = new Map<string, WheelData>();

  static s_instance: BusyWheelService;

  constructor() {}

  static getInstance(): BusyWheelService {
    if (!this.s_instance) {
      this.s_instance = new BusyWheelService();
    }
    return this.s_instance;
  }

  show(id?: string) {
    if (id) {
      const idParts = id.split(',');
      idParts.forEach(id => {
        const trimmedId = id.trim();
        const busyWheelDirs = this.namedBusyWheelDirs.get(trimmedId);
        if (busyWheelDirs) {
          const containers = Array.isArray(busyWheelDirs) ? busyWheelDirs : [busyWheelDirs];
          containers.forEach((busyWheelDir, index) => {
            const wheelId = `${trimmedId}_${index}`;
            //console.log(`showing busy-wheel: ${wheelId} for busyWheel: ${busyWheelDir.hostBusyWheel}`);
            const busyWheelComponentRef = busyWheelDir.viewContainerRef.createComponent<SPMatBusyWheelComponent>(SPMatBusyWheelComponent);
            busyWheelComponentRef.setInput('wheelId', wheelId);
            // Append the component as a child of the element with hostBusyWheel directive.
            busyWheelDir.renderer2.appendChild(
              busyWheelDir.viewContainerRef.element.nativeElement,
              busyWheelComponentRef.injector.get(SPMatBusyWheelComponent).elRef.nativeElement
            );
            // Save the position explicit css style of the element if one was set
            let oldStyles = new Array<StyleInfo>();
            if (busyWheelDir.viewContainerRef.element.nativeElement.style.position) {
              oldStyles.push({
                style: 'position',
                value: busyWheelDir.viewContainerRef.element.nativeElement.style.position
              });
            }
            // Set the element's child controls's poisitioning to 'relative'
            busyWheelDir.viewContainerRef.element.nativeElement.style.position = 'relative';
            this.wheelComponents.set(wheelId, {
              component: busyWheelComponentRef,
              oldStyles: []
            });
            // const busyWheel = this.createBusyWheel(
            //   'busy-wheel-container busy-wheel-backdrop-dim-100',
            //   wheelId
            // );
            //   (viewContainerRef.element.nativeElement as HTMLElement).prepend(busyWheel);
          });
        }
      })
    } else {
      // viewport global busy-wheel
      const busyWheel = this.createBusyWheel(
        'busy-wheel-container busy-wheel-backdrop-dimwh-100',
        undefined
      );
      const backdrop = this.createBackdrop();
      backdrop.firstChild?.appendChild(busyWheel);
      const fc = backdrop.querySelector('body')?.firstChild;
      if (fc) {
        document.body.appendChild(fc);
      }
    }
  }

  hide(id?: string) {
    if (id) {
      const idParts = id.split(',');
      idParts.forEach(id => {
        const trimmedId = id.trim();
        const busyWheelDirs = this.namedBusyWheelDirs.get(trimmedId);
        if (busyWheelDirs) {
          const containers = Array.isArray(busyWheelDirs) ? busyWheelDirs : [busyWheelDirs];
          containers.forEach((busyWheelDir, index) => {
            const wheelId = `${trimmedId}_${index}`;
            const wheelData = this.wheelComponents.get(wheelId);
            if (wheelData) {
              //console.log(`destroying busy-wheel: ${wheelId}`);
              wheelData.component.destroy();
              this.wheelComponents.delete(wheelId);
              if (wheelData?.oldStyles && wheelData.oldStyles.length) {
                // Remove position: relative style that we added
                (busyWheelDir.viewContainerRef.element.nativeElement as HTMLElement).style.position = '';
                wheelData.oldStyles.forEach(style => {
                  busyWheelDir.viewContainerRef.element.nativeElement.style[style.style] = style.value;
                });
              }
            }
            // this.removeBusyWheel(wheelId);
          });
        }
      });
    } else {
      // viewport global busy-wheel, remove the entire backdrop, which
      // will also kill the child busy-wheel.
      this.removeBusyWheel();
    }
  }

  registerBusyWheelHost(busyWheelDir: SPMatHostBusyWheelDirective) {
    const id = busyWheelDir.spHostBusyWheel();
    if (!id) {
      if (!this.defaultBusyWheelDir) {
        if (!this.defaultBusyWheelDir) {
          this.defaultBusyWheelDir = busyWheelDir;
        }
      }
    } else {
      if (!this.namedBusyWheelDirs.get(id)) {
        //console.log(`registering busyWheelDir with id: ${id}`);
        this.namedBusyWheelDirs.set(id, []);
      }
      this.namedBusyWheelDirs.get(id)?.push(busyWheelDir);
      // this.namedHostViewContainerRefs.set(id, viewContainerRef);
    }
  }

  deregisterBusyWheelHost(busyWheelDir: SPMatHostBusyWheelDirective) {
    const busyWheelId = busyWheelDir.spHostBusyWheel()
    if (!busyWheelId) {
      (this.defaultBusyWheelDir as any) = undefined;
    } else {
      //console.log(`deregistering busyWheel with id: ${busyWheelDir.hostBusyWheel}`);
      this.namedBusyWheelDirs.delete(busyWheelId);
    }
  }

  // private getContainersFromId(id: string) {
  //   let viewContainers = new Array<ViewContainerRef>();
  //   if (id) {
  //     const idParts = id.split(',');
  //     idParts.forEach(id => {
  //       const containers = this.namedBusyWheelDirs.get(id.trim());
  //       if (containers) {
  //         viewContainers = viewContainers.concat(containers);
  //       }
  //     });
  //   } else if (this.defaultBusyWheelDir) {
  //     viewContainers.push(this.defaultBusyWheelDir)
  //   }
  //   return viewContainers;
  // }

  /**
   * Creates a div fragment that hosts the busy wheel. The fragment has the following
   * structure:
   *
   *  <div id="id_busy-wheel_{id}">
   *    <div class="{containerClass}">
   *      <div class="busy-wheel">
   *      </div>
   *    </div>
   *  </div>
   * @param containerClass
   * @param id
   * @returns
   */
  private createBusyWheel(containerClass: string, id: string|undefined): DocumentFragment {
    let wheelId = BUSY_WHEEL_DIV_ID;
    if (id) {
      wheelId += `_${id}`;
    }
    let template = BUSY_WHEEL_FRAGMENT_TEMPLATE;
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      template
        .replace('{wheelId}', wheelId)
        .replace('{containerClass}', containerClass),
      'text/html'
    );
    const fragment = document.createDocumentFragment();
    fragment.appendChild(doc.documentElement);
    return fragment;
  }

  private createBackdrop() {
    const fragment = document.createDocumentFragment();
    const backdropDiv = document.createElement('div');
    backdropDiv.className = 'busy-wheel-backdrop';
    backdropDiv.setAttribute('id', BACKDROP_DIV_ID);
    fragment.appendChild(backdropDiv);
    return fragment;
  }

  private removeBusyWheel(id?: string) {
    let wheelId = BUSY_WHEEL_DIV_ID;
    if (id) {
      wheelId += `_${id}`;
    }
    const body: HTMLElement = document.body;
    const busyWheelDiv = body.querySelector(`div#${wheelId}`);
    if (busyWheelDiv) {
      busyWheelDiv.remove();
    }
  }
}

export function registerBusyWheelHost(busyWheelDir: SPMatHostBusyWheelDirective) {
  const instance = BusyWheelService.getInstance();
  instance.registerBusyWheelHost(busyWheelDir);
}

export function deregisterBusyWheelHost(busyWheelDir: SPMatHostBusyWheelDirective) {
  const instance = BusyWheelService.getInstance();
  instance.deregisterBusyWheelHost(busyWheelDir);
}

export function showBusyWheel(id?: string) {
  const instance = BusyWheelService.getInstance();
  instance.show(id);
}

export function hideBusyWheel(id?: string) {
  const instance = BusyWheelService.getInstance();
  instance.hide(id);
}
