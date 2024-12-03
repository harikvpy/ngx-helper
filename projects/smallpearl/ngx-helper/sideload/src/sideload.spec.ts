import { sideloadToComposite } from "./sideload";

const MULTI_OBJECT_RESPONSE = {
  "contacts": [
    {
      "id": 37,
      "type": "CU",
      "salutation": "dr",
      "contact": "Hsu Chia-Ling",
      "company": "",
      "displayName": "Chia-Ling",
      "address": "",
      "telephoneWork": "",
      "telephoneMobile": "",
      "email": "",
      "website": "",
      "notes": "",
      "terms": 0,
      "locked": false,
      "customerDue": 3350.0,
      "balance": 3350.0
    }
  ],
  "accounts": [
    {
      "id": 1197,
      "name": "FirstBankNTD",
      "notes": null,
      "type": "BAN",
      "category": "AS",
      "active": true,
      "system": false,
      "balance": 4600.0,
      "parent": null
    }
  ],
  "invoices": [
    {
      "id": 74,
      "date": "2024-11-26",
      "number": "1000",
      "contact": 37,
      "terms": 0,
      "isPaid": false,
      "notes": "",
      "total": 1800.0,
      "balance": 800.0,
      "links": {
        "items": "items/"
      }
    }
  ],
  "customerPayments": [
    {
      "id": 50,
      "number": 1,
      "date": "2024-11-26",
      "contact": 37,
      "amount": 1800.0,
      "balance": 800.0,
      "account": 1197,
      "reference": null,
      "notes": null,
      "items": [
        {
          "id": 39,
          "invoice": 74,
          "amount": 1000.0
        }
      ]
    },
    {
      "id": 51,
      "number": 2,
      "date": "2024-11-26",
      "contact": 37,
      "amount": 1000.0,
      "balance": 1000.0,
      "account": 1197,
      "reference": null,
      "notes": null,
      "items": []
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 50,
    "totalResults": 2,
    "totalPages": 1
  }
}

const SINGLE_OBJECT_RESPONSE = {
  "contacts": [
    {
      "id": 37,
      "type": "CU",
      "salutation": "dr",
      "contact": "Hsu Chia-Ling",
      "company": "",
      "displayName": "Chia-Ling",
      "address": "",
      "telephoneWork": "",
      "telephoneMobile": "",
      "email": "",
      "website": "",
      "notes": "",
      "terms": 0,
      "locked": false,
      "customerDue": 3350.0,
      "balance": 3350.0
    }
  ],
  "accounts": [
    {
      "id": 1197,
      "name": "FirstBankNTD",
      "notes": null,
      "type": "BAN",
      "category": "AS",
      "active": true,
      "system": false,
      "balance": 4600.0,
      "parent": null
    }
  ],
  "invoices": [
    {
      "id": 74,
      "date": "2024-11-26",
      "number": "1000",
      "customer": 37,
      "terms": 0,
      "isPaid": false,
      "notes": "",
      "total": 1800.0,
      "balance": 800.0,
      "links": {
        "items": "items/"
      }
    }
  ],
  "customerPayment": {
    "id": 50,
    "number": 1,
    "date": "2024-11-26",
    "contact": 37,
    "amount": 1800.0,
    "balance": 800.0,
    "account": 1197,
    "reference": null,
    "notes": null,
    "items": [
      {
        "id": 39,
        "invoice": 74,
        "amount": 1000.0
      }
    ]
  }
}

const MULTI_OBJECT_RESPONSE_WITH_KEY_MISMATCH = {
  "contacts": [
    {
      "id": 37,
      "type": "CU",
      "salutation": "dr",
      "contact": "Hsu Chia-Ling",
      "company": "",
      "displayName": "Chia-Ling",
      "address": "",
      "telephoneWork": "",
      "telephoneMobile": "",
      "email": "",
      "website": "",
      "notes": "",
      "terms": 0,
      "locked": false,
      "customerDue": 3350.0,
      "balance": 3350.0
    }
  ],
  "accounts": [
    {
      "id": 1197,
      "name": "FirstBankNTD",
      "notes": null,
      "type": "BAN",
      "category": "AS",
      "active": true,
      "system": false,
      "balance": 4600.0,
      "parent": null
    }
  ],
  "invoices": [
    {
      "id": 74,
      "date": "2024-11-26",
      "number": "1000",
      "contact": 37,
      "terms": 0,
      "isPaid": false,
      "notes": "",
      "total": 1800.0,
      "balance": 800.0,
      "links": {
        "items": "items/"
      }
    }
  ],
  "customerPayments": [
    {
      "id": 50,
      "number": 1,
      "date": "2024-11-26",
      "customer": 37,
      "amount": 1800.0,
      "balance": 800.0,
      "account": 1197,
      "reference": null,
      "notes": null,
      "items": [
        {
          "id": 39,
          "invoice": 74,
          "amount": 1000.0
        }
      ]
    },
    {
      "id": 51,
      "number": 2,
      "date": "2024-11-26",
      "customer": 37,
      "amount": 1000.0,
      "balance": 1000.0,
      "account": 1197,
      "reference": null,
      "notes": null,
      "items": []
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 50,
    "totalResults": 2,
    "totalPages": 1
  }
}


const MULTI_OBJECT_RESPONSE_WITH_CUSTOM_KEY = {
  "contacts": [
    {
      "id": 37,
      "type": "CU",
      "salutation": "dr",
      "contact": "Hsu Chia-Ling",
      "company": "",
      "displayName": "Chia-Ling",
      "address": "",
      "telephoneWork": "",
      "telephoneMobile": "",
      "email": "",
      "website": "",
      "notes": "",
      "terms": 0,
      "locked": false,
      "customerDue": 3350.0,
      "balance": 3350.0
    }
  ],
  "accounts": [
    {
      "id": 1197,
      "name": "FirstBankNTD",
      "code": "FBNTD",
      "notes": null,
      "type": "BAN",
      "category": "AS",
      "active": true,
      "system": false,
      "balance": 4600.0,
      "parent": null
    }
  ],
  "invoices": [
    {
      "id": 74,
      "date": "2024-11-26",
      "number": "1000",
      "contact": 37,
      "terms": 0,
      "isPaid": false,
      "notes": "",
      "total": 1800.0,
      "balance": 800.0,
      "links": {
        "items": "items/"
      }
    }
  ],
  "customerPayments": [
    {
      "id": 50,
      "number": 1,
      "date": "2024-11-26",
      "customer": 37,
      "amount": 1800.0,
      "balance": 800.0,
      "account": "FBNTD",
      "reference": null,
      "notes": null,
      "items": [
        {
          "id": 39,
          "invoice": 74,
          "amount": 1000.0
        }
      ]
    },
    {
      "id": 51,
      "number": 2,
      "date": "2024-11-26",
      "customer": 37,
      "amount": 1000.0,
      "balance": 1000.0,
      "account": "FBNTD",
      "reference": null,
      "notes": null,
      "items": []
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 50,
    "totalResults": 2,
    "totalPages": 1
  }
}

describe('sideloadToComposite', () => {
  it('should merge sideload data into an array of composite objects (append)', () => {
    const customerPayments = sideloadToComposite(
      JSON.parse(JSON.stringify(MULTI_OBJECT_RESPONSE)),
      'customerPayments', 'id');
    expect(customerPayments).toBeTruthy();
    expect(customerPayments[0]['contactDetail']).toBeTruthy();
    expect(customerPayments[0]['accountDetail']).toBeTruthy();
    expect(customerPayments[0].items[0]['invoiceDetail']).toBeTruthy();
  });

  it('should merge sideload data with custom key into an array of composite objects (append)', () => {
    const customerPayments = sideloadToComposite(
      JSON.parse(JSON.stringify(MULTI_OBJECT_RESPONSE_WITH_CUSTOM_KEY)),
      'customerPayments',
      'id',
      'append',
      'Detail',
      [['customer', 'contacts'], ['account', 'accounts', 'code']]
    );
    expect(customerPayments).toBeTruthy();
    expect(customerPayments[0]['customerDetail']).toBeTruthy();
    expect(customerPayments[0]['accountDetail']).toBeTruthy();
    expect(customerPayments[0].items[0]['invoiceDetail']).toBeTruthy();
  });

  it('should merge sideload data with custom key into an array of composite objects (inplace)', () => {
    const customerPayments = sideloadToComposite(
      JSON.parse(JSON.stringify(MULTI_OBJECT_RESPONSE_WITH_CUSTOM_KEY)),
      'customerPayments',
      'id',
      'inplace',
      'Detail',
      [['customer', 'contacts'], ['account', 'accounts', 'code']]
    );
    expect(customerPayments).toBeTruthy();
    expect(typeof customerPayments[0]['customer']).toEqual('object');
    expect(typeof customerPayments[0]['account']).toEqual('object');
    expect(typeof customerPayments[0].items[0]['invoice']).toEqual('object');
  });

  it('should merge sideload data into a single composite object', () => {
    const customerPayment = sideloadToComposite(
      JSON.parse(JSON.stringify(SINGLE_OBJECT_RESPONSE)),
      'customerPayment',
      'id'
    );
    expect(customerPayment).toBeTruthy();
    expect(customerPayment['contactDetail']).toBeTruthy();
    expect(customerPayment['accountDetail']).toBeTruthy();
    expect(customerPayment.items[0]['invoiceDetail']).toBeTruthy();
  });

  it('should merge sideload data into a single composite object with default idKey', () => {
    const customerPayment = sideloadToComposite(
      JSON.parse(JSON.stringify(SINGLE_OBJECT_RESPONSE)),
      'customerPayment'
    );
    expect(customerPayment).toBeTruthy();
    expect(customerPayment['contactDetail']).toBeTruthy();
    expect(customerPayment['accountDetail']).toBeTruthy();
    expect(customerPayment.items[0]['invoiceDetail']).toBeTruthy();
  });

  it('should return undefined if composite object is not found', () => {
    const customerPayment = sideloadToComposite(
      JSON.parse(JSON.stringify(SINGLE_OBJECT_RESPONSE)),
      'customer',
      'id'
    );
    expect(customerPayment).toBeFalsy();
  });

  it('should merge sideload data into an array of composite objects', () => {
    const customerPayments = sideloadToComposite(
      JSON.parse(JSON.stringify(MULTI_OBJECT_RESPONSE_WITH_KEY_MISMATCH)),
      'customerPayments',
      'id',
      'append',
      'Detail',
      [['customer', 'contacts']]
    );
    expect(customerPayments).toBeTruthy();
    expect(customerPayments[0]['customerDetail']).toBeTruthy();
    expect(customerPayments[0]['accountDetail']).toBeTruthy();
    expect(customerPayments[0].items[0]['invoiceDetail']).toBeTruthy();
  });

  it('should merge sideload data into an array of composite objects (inplace)', () => {
    const customerPayments = sideloadToComposite(
      JSON.parse(JSON.stringify(MULTI_OBJECT_RESPONSE)),
      'customerPayments',
      'id',
      'inplace'
    );
    expect(customerPayments).toBeTruthy();
    expect(typeof customerPayments[0]['contact']).toEqual('object');
    expect(typeof customerPayments[0]['account']).toEqual('object');
    expect(typeof customerPayments[0].items[0]['invoice']).toEqual('object');
  });
});
