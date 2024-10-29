import { Directive, input, Input, OnDestroy, OnInit, Renderer2, ViewContainerRef } from '@angular/core';
import { deregisterBusyWheelHost, registerBusyWheelHost } from './busy-wheel.service';

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
})
export class SPMatHostBusyWheelDirective implements OnInit, OnDestroy {

  spHostBusyWheel = input<string>()

  constructor(
    public viewContainerRef: ViewContainerRef,
    public renderer2: Renderer2,
  ) {}

  ngOnInit(): void {
    registerBusyWheelHost(this);
  }

  ngOnDestroy(): void {
    deregisterBusyWheelHost(this);
  }
}
