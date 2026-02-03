import {
  Directive,
  input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import {
  deregisterBusyWheelHost,
  registerBusyWheelHost,
} from './busy-wheel.service';
import { SPMatHostBusyWheelDirectiveBase } from './host-busy-wheel-directive-base';

/**
 * Use this directive with a unique value assigned to it to display a busy
 * wheel over it. This can be used as:-
 *
 * import {showBusyWheelUntilComplete} from '@smallpearl/ngx-helper/mat-busy-wheel';
 *
 * <div spHostBusyWheel='myDivBusyWheel'>
 *  ..content
 * </div>
 *
 * Then in your code:
 *
 * obs.pipe(
 *  showBusyWheelUntilComplete('myDivBusyWheel'),
 *  tap((resp) => {
 *    ...
 *  })
 * ).subscribe();
 *
 * This will cover the 'div' above when the obs is waiting to be completed.
 * (or error). Note that you can also use the trackBusyWheelStatus() function
 * if you want more control over the busy wheel.
 */
@Directive({
  selector: '[spHostBusyWheel]',
  standalone: true,
})
export class SPMatHostBusyWheelDirective
  extends SPMatHostBusyWheelDirectiveBase
  implements OnInit, OnDestroy
{
  spHostBusyWheel = input<string>();

  constructor(
    public viewContainerRef: ViewContainerRef,
    public renderer2: Renderer2,
  ) {
    super();
  }

  ngOnInit(): void {
    registerBusyWheelHost(this);
  }

  ngOnDestroy(): void {
    deregisterBusyWheelHost(this);
  }

  getBusyWheelId(): string | undefined {
    return this.spHostBusyWheel();
  }

  getViewContainerRef(): ViewContainerRef {
    return this.viewContainerRef;
  }

  getRenderer2(): Renderer2 {
    return this.renderer2;
  }
}
