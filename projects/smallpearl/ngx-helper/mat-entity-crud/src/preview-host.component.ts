import {
  ChangeDetectionStrategy,
  Component,
  EmbeddedViewRef,
  input,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';

@Component({
  standalone: true,
  imports: [],
  selector: 'sp-entity-crud-preview-host',
  template: ` <ng-container #previewComponent></ng-container> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewHostComponent<TEntity> implements OnInit, OnDestroy {
  vc = viewChild('previewComponent', { read: ViewContainerRef });

  entityCrudComponentBase =
    input.required<SPMatEntityCrudComponentBase<TEntity>>();
  clientViewTemplate = input<TemplateRef<any> | null>(null);
  entity = signal<TEntity | undefined>(undefined);
  clientView!: EmbeddedViewRef<any> | null;

  constructor() {
    // effect(() => {
    //   const tmpl = this.clientViewTemplate();
    //   this.createClientView(tmpl);
    // });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  show(entity: TEntity | undefined, params?: any) {
    this.entity.set(entity);
    // if (params && params?.title) {
    //   this.title.set(params.title);
    // } else {
    //   this.title.set(entity ? this.config.i18n.editItemLabel(this.itemLabel()) : this.config.i18n.newItemLabel(this.itemLabel()));
    // }
    // this.params.set(params);
    this.createClientView();
  }

  close() {
    // this.entityCrudComponentBase().closeCreateEdit(cancel);
    // destroy the client's form component
    this.destroyClientView();
  }

  private createClientView() {
    if (this.clientView) {
      // We have only one view in the ng-container. So we might as well
      // call clear() to remove all views contained in it.
      this.vc()!.clear();
      this.clientView.destroy();
    }
    /** Render preview component if one was provided */
    const ft = this.clientViewTemplate();
    const vc = this.vc();
    if (ft && vc) {
      this.clientView = this.vc()!.createEmbeddedView(ft, {
        $implicit: {
          entity: this.entity(),
          entityCrudComponent: this.entityCrudComponentBase(),
        },
      });
      this.clientView.detectChanges();
    }
  }

  destroyClientView() {
    if (this.clientView) {
      this.clientView.destroy();
      this.clientView = null;
    }
  }

  // close() {
  //   this.closePreview.emit();
  // }
}
