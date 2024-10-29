import { ComponentRef, Injectable } from '@angular/core';
import { SPMatBusyWheelComponent } from './busy-wheel.component';
import { SPMatHostBusyWheelDirective } from './host-busy-wheel.directive';

const BACKDROP_DIV_ID = 'id_busy-wheel-backdrop';
const BUSY_WHEEL_DIV_ID = 'id_busy-wheel';

const VIEWPORT_BUSY_WHEEL_STYLE_ID = 'id_viewport_busy_wheel_style';
const VIEWPORT_BUSY_WHEEL_STYLE = `
  .busy-wheel-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    z-index: 9999999;
    background-color: rgba(255, 255, 255, 0.35);
  }
  .busy-wheel-container {
    display: flex;
    position: relative;
    top: 0;
    height: 100%;
    width: 100%;
  }
  .busy-wheel,
  .busy-wheel:after {
    border-radius: 50%;
    width: 4em;
    height: 4em;
  }
  .busy-wheel {
    margin: auto auto;
    font-size: 8px;
    position: relative;
    text-indent: -9999em;
    border-top: 0.5em solid rgba(0, 0, 0, 0.8);
    border-right: 0.5em solid rgba(0, 0, 0, 0.8);
    border-bottom: 0.5em solid rgba(0, 0, 0, 0.8);
    border-left: 0.5em solid #ffffff;
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-animation: load8 1.1s infinite linear;
    animation: load8 1.1s infinite linear;
  }
  @-webkit-keyframes load8 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes load8 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }

    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
`;
const VIEWPORT_BUSY_WHEEL_FRAGMENT_TEMPLATE = `
<div class="busy-wheel-wrapper" id="{wheelId}">
  <div class="{containerClass}" style="display: flex; position: relative; top: 0; width: 100vw; height: 100vh; z-index: 9999999;">
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
          });
        }
      })
    } else {
      // viewport global busy-wheel
      const busyWheel = this.createViewportBusyWheel(
        'busy-wheel-container',
        undefined
      );
      const backdrop = this.createBackdrop();
      backdrop.firstChild?.appendChild(busyWheel);
      const viewportBusyWheelStyle = backdrop.querySelector('style');
      if (viewportBusyWheelStyle) {
        document.head.appendChild(viewportBusyWheelStyle);
      }
      const viewportBusyWheelDiv = backdrop.querySelector('body')?.firstChild;
      if (viewportBusyWheelDiv) {
        document.body.appendChild(viewportBusyWheelDiv);
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
      this.removeViewportBusyWheel();
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
   *      <!-- <div class="busy-wheel"></div> -->
   *      <mat-spinner></mat-spinner>
   *    </div>
   *  </div>
   * @param containerClass
   * @param id
   * @returns
   */
  private createViewportBusyWheel(containerClass: string, id: string|undefined): DocumentFragment {
    let wheelId = BUSY_WHEEL_DIV_ID;
    if (id) {
      wheelId += `_${id}`;
    }
    let template = VIEWPORT_BUSY_WHEEL_FRAGMENT_TEMPLATE;
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      template
        .replace('{wheelId}', wheelId)
        .replace('{containerClass}', containerClass),
      'text/html'
    );
    const fragment = document.createDocumentFragment();
    fragment.appendChild(doc.documentElement);

    // Create the style element
    const style = document.createElement('style');
    style.textContent = VIEWPORT_BUSY_WHEEL_STYLE;
    style.id = VIEWPORT_BUSY_WHEEL_STYLE_ID;
    fragment.querySelector('head')?.appendChild(style);

    return fragment;
  }

  /**
   * Creates a backdrop overlay, of the same size as the container that it
   * covers, on which the busy wheel will be positioned.
   * @returns
   */
  private createBackdrop() {
    const fragment = document.createDocumentFragment();
    const backdropDiv = document.createElement('div');
    backdropDiv.className = 'busy-wheel-backdrop';
    backdropDiv.setAttribute('id', BACKDROP_DIV_ID);
    fragment.appendChild(backdropDiv);
    return fragment;
  }

  private removeViewportBusyWheel(id?: string) {
    let wheelId = BUSY_WHEEL_DIV_ID;
    if (id) {
      wheelId += `_${id}`;
    }
    const body: HTMLElement = document.body;
    const busyWheelDiv = body.querySelector(`div#${wheelId}`);
    if (busyWheelDiv) {
      busyWheelDiv.remove();
    }

    // remove the style
    const busyWheelStyle = document.head.querySelector(
      `style#${VIEWPORT_BUSY_WHEEL_STYLE_ID}`
    );
    if (busyWheelStyle) {
      busyWheelStyle.remove();
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
