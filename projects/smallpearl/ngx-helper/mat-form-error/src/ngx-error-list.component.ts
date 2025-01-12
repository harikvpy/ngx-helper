import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { NgxMatErrors } from './ngx-mat-errors.component';
import { provideDefaultNgxMatErrorControl } from './ngx-mat-error-control';
import { NgxMatErrorControls } from './types';

@Component({
  selector: 'ngx-error-list, [ngx-error-list]',
  template: `<ng-template #defaultTemplate let-error>
    <ul>
      @if (isArray(error)) {
        @for (item of error; track $index) {
          <li>{{item}}</li>
        }
      } @else {
        <li>{{ error }}</li>
      }
    </ul>
    </ng-template
    >@if( error$ | async; as error) {
    <ng-template
      [ngTemplateOutlet]="error.template ?? defaultTemplate"
      [ngTemplateOutletContext]="error"
    ></ng-template>
    }`,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, NgTemplateOutlet],
  standalone: true,
  host: {
    class: 'ngx-error-list',
  },
  providers: [provideDefaultNgxMatErrorControl()],
})
export class NgxErrorList extends NgxMatErrors {

  isArray(e: string|string[]) {
    // console.log(`NgxErrorList - isArray.e: ${e}`);
    return typeof e !== 'string' && Array.isArray(e);
  }

  @Input('ngx-error-list')
  public override set control(control: NgxMatErrorControls) {
    super.control = control;
  }
}
