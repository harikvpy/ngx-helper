import {
  ChangeDetectionStrategy,
  Component,
  effect,
  EmbeddedViewRef,
  EventEmitter,
  input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';

@Component({
  imports: [],
  standalone: true,
  selector: 'sp-entity-crud-preview-host',
  template: ` <ng-container #previewComponent></ng-container> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewHostComponent<TEntity> implements OnInit, OnDestroy {
  vc = viewChild('previewComponent', { read: ViewContainerRef });
  @Output() closePreview = new EventEmitter<void>();

  entityCrudComponent = input.required<SPMatEntityCrudComponentBase<TEntity>>();
  previewTemplate = input.required<TemplateRef<any>>();
  previewedEntity = input.required<any>();
  embeddedView!: EmbeddedViewRef<any>;

  constructor() {
    effect(() => {
      const tmpl = this.previewTemplate();
      this.createClientPreviewTemplate(tmpl);
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  private createClientPreviewTemplate(tmpl: TemplateRef<any>) {
    if (this.embeddedView) {
      // We have only one view in the ng-container. So we might as well
      // call clear() to remove all views contained in it.
      this.vc()!.clear();
      this.embeddedView.destroy();
    }
    /** Render preview component if one was provided */
    if (tmpl) {
      this.embeddedView = this.vc()!.createEmbeddedView(
        tmpl,
        {
          $implicit: {
            entity: this.previewedEntity(),
            entityCrudComponent: this.entityCrudComponent(),
          },
        }
      );
      this.embeddedView.detectChanges();
    }
  }

  close() {
    this.closePreview.emit();
  }
}
