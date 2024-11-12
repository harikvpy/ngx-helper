import { ChangeDetectorRef, Component, input, OnInit } from '@angular/core';
import { SPEntityFieldSpec } from '@smallpearl/ngx-helper/entity-field';
import { StationaryWithLineItemsComponent } from '@smallpearl/ngx-helper/stationary-with-line-items';
import { Invoice } from './data';

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
      valueFn: (entity: Invoice, cdr?: ChangeDetectorRef) => {
        return entity.balance;
      },
      valueOptions: { isCurrency: true, class: "text-larger " },
    },
  ];
  invoicePreviewItemColumns: SPEntityFieldSpec<Invoice>[] = [
    {
      name: 'product',
      valueFn: (lineItem: any) => {
        return lineItem.productDetail.name
      },
    },
    { name: 'quantity' },
    { name: 'unitPrice' },
    {
      name: 'total',
      valueFn: (lineItem: any) => lineItem.quantity * lineItem.unitPrice,
      valueOptions: { isCurrency: true, alignment: 'end' },
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
