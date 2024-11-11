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
      [itemColumns]="invoicePreviewItemColumns"
      [rightFooter]="rightFooterFields"
    >
      <ng-container #leftHeader></ng-container>
      <ng-container #rightHeader></ng-container>
    </sp-stationary-with-line-items>
  `,
})
export class PreviewInvoiceComponent implements OnInit {
  invoice = input.required<Invoice>();

  invoiceColumns: SPMatEntityListColumn<Invoice>[] = [
    { name: 'id' },
    { name: 'date' },
    { name: 'customer', valueFn: (item: Invoice) => item.customerDetail.name },
    { name: 'terms' },
    {
      name: 'balance',
      valueFn: (item: Invoice) => spFormatCurrency(item.balance) ?? '',
    },
  ];
  invoicePreviewLeftHeader = (invoice: Invoice) => invoice.customerDetail.name;
  invoicePreviewRightHeaderFields: SPEntityFieldSpec<Invoice>[] = [
    { name: 'date' },
    { name: 'terms' },
    {
      name: 'balance',
      valueOptions: { isCurrency: true },
    },
  ];
  invoicePreviewItemColumns: SPEntityFieldSpec<Invoice>[] = [
    {
      name: 'product',
      valueFn: (lineItem: any) => lineItem.productDetail.name,
    },
    { name: 'quantity' },
    { name: 'unitPrice' },
    {
      name: 'total',
      valueFn: (lineItem: any) => lineItem.quantity * lineItem.unitPrice,
      valueOptions: { isCurrency: true },
    },
  ];
  rightFooterFields: SPEntityFieldSpec<Invoice>[] = [
    {
      name: 'total',
      label: 'TOTAL',
      valueFn: (invoice: Invoice) => {
        let total = 0;
        invoice.items.forEach(
          (item) => (total += item.unitPrice * item.quantity)
        );
        return spFormatCurrency(total) ?? '';
      },
    },
  ];

  constructor() {}

  ngOnInit() {}
}
