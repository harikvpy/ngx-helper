import { Renderer2, ViewContainerRef } from '@angular/core';

export abstract class SPMatHostBusyWheelDirectiveBase {
  abstract getBusyWheelId(): string | undefined;
  abstract getViewContainerRef(): ViewContainerRef;
  abstract getRenderer2(): Renderer2;
}
