import { Directive, input, Input, OnDestroy, OnInit, Renderer2, ViewContainerRef } from '@angular/core';
import { deregisterBusyWheelHost, registerBusyWheelHost } from './busy-wheel.service';

/**
 *
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
