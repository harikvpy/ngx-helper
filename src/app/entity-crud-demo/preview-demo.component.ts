import { Component, input, OnInit } from '@angular/core';
import { Invoice } from './data';
import { SPEntityFieldSpec, StationaryWithLineItemsComponent } from '@smallpearl/ngx-helper/stationary-with-line-items';
import { spFormatCurrency } from '@smallpearl/ngx-helper/locale';
import { SPMatEntityListColumn } from '@smallpearl/ngx-helper/mat-entity-list';

@Component({
  standalone: true,
  imports: [StationaryWithLineItemsComponent],
  selector: 'app-invoice-preview',
  template: `
    <sp-stationary-with-line-items
      [entity]="invoice()"
      title="INVOICE"
      [number]="invoice().number"
      [leftHeader]="invoicePreviewLeftHeader(invoice())"
      [rightHeader]="invoicePreviewRightHeaderFields"
      [itemColumnFields]="invoicePreviewItemColumns"
      [rightFooter]="rightFooterFields"
    >
    </sp-stationary-with-line-items>
  `,
})
export class PreviewInvoiceComponent implements OnInit {
  invoice = input.required<Invoice>();
  invoicePreviewLeftHeader = (invoice: Invoice) => invoice.customerDetail.name;
  invoicePreviewRightHeaderFields: SPEntityFieldSpec<Invoice>[] = [
    { name: 'date' },
    { name: 'terms' },
    {
      name: 'balance',
      valueFn: (spec: SPEntityFieldSpec<Invoice>, entity: Invoice) => {
        if (spec.valueOptions?.class) {
          spec.valueOptions.class += entity.balance > 0 ? 'text-red' : 'text-green';
        }
        return entity.balance;
      },
      valueOptions: { isCurrency: true, class: "text-larger " },
    },
  ];
  invoicePreviewItemColumns: SPEntityFieldSpec<Invoice>[] = [
    {
      name: 'product',
      valueFn: (spec: SPEntityFieldSpec<Invoice>, lineItem: any) => {
        return lineItem.productDetail.name
      },
    },
    { name: 'quantity' },
    { name: 'unitPrice' },
    {
      name: 'total',
      valueFn: (spec: SPEntityFieldSpec<Invoice>, lineItem: any) => lineItem.quantity * lineItem.unitPrice,
      valueOptions: { isCurrency: true, class: 'text-end' },
    },
  ];
  rightFooterFields: SPEntityFieldSpec<Invoice>[] = [
    {
      name: 'total',
      label: 'TOTAL',
      valueFn: (fs: SPEntityFieldSpec<Invoice>, invoice: Invoice) => {
        let total = 0;
        invoice.items.forEach(
          (item) => (total += item.unitPrice * item.quantity)
        );
        return total;
      },
      valueOptions: {
        isCurrency: true,
        class: 'text-end text-larger text-bold'
      }
    },
  ];

  constructor() {}

  ngOnInit() {}
}
