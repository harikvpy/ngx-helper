
export interface Customer {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  unitPrice: number;
}

export interface Invoice {
  id: number;
  number: number;
  date: Date;
  customer: number;
  customerDetail: Customer,
  terms: number;
  items: {
    product: number;
    productDetail: Product;
    quantity: number;
    unitPrice: number;
  }[],
  balance: number;
}

export const CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'John'
  },
  {
    id: 2,
    name: 'Peter'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 100,
    name: 'Management Fee',
    unitPrice: 85
  },
  {
    id: 101,
    name: 'Carpark Fee',
    unitPrice: 900
  },
  {
    id: 102,
    name: 'Garbage Fee',
    unitPrice: 150
  }
];

export const INVOICES: Invoice[] = [
  {
    id: 1000,
    number: 1000001,
    date: new Date(),
    customer: 1,
    customerDetail: CUSTOMERS[0],
    terms: 30,
    items: [
      {
        product: 100,
        productDetail: PRODUCTS[0],
        unitPrice: 85,
        quantity: 32,
      },
      {
        product: 101,
        productDetail: PRODUCTS[1],
        unitPrice: 900,
        quantity: 1,
      }
    ],
    balance: 3620
  },
  {
    id: 1001,
    number: 1000002,
    date: new Date(),
    customer: 2,
    customerDetail: CUSTOMERS[1],
    terms: 30,
    items: [
      {
        product: 101,
        productDetail: PRODUCTS[1],
        unitPrice: 900,
        quantity: 1,
      }
    ],
    balance: 900
  }
];
