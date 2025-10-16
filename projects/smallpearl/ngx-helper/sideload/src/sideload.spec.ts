import { sideloadToComposite } from "./sideload";

const MULTI_OBJECT_RESPONSE = {
  contacts: [
    {
      id: 37,
      type: 'CU',
      salutation: 'dr',
      contact: 'Hsu Chia-Ling',
      company: '',
      displayName: 'Chia-Ling',
      address: '',
      telephoneWork: '',
      telephoneMobile: '',
      email: '',
      website: '',
      notes: '',
      terms: 0,
      locked: false,
      customerDue: 3350.0,
      balance: 3350.0,
      account: 1198
    },
  ],
  accounts: [
    {
      id: 1197,
      name: 'FirstBankNTD',
      notes: null,
      type: 'BAN',
      category: 'AS',
      active: true,
      system: false,
      balance: 4600.0,
      parent: null,
    },
    {
      id: 1198,
      name: 'Fubon',
      notes: null,
      type: 'BAN',
      category: 'AS',
      active: true,
      system: false,
      balance: 100.0,
      parent: null,
    },
  ],
  invoices: [
    {
      id: 74,
      date: '2024-11-26',
      number: '1000',
      contact: 37,
      terms: 0,
      isPaid: false,
      notes: '',
      total: 1800.0,
      balance: 800.0,
      links: {
        items: 'items/',
      },
    },
  ],
  customerPayments: [
    {
      id: 50,
      number: 1,
      date: '2024-11-26',
      contact: 37,
      amount: 1800.0,
      balance: 800.0,
      account: 1197,
      reference: null,
      notes: null,
      items: [
        {
          id: 39,
          invoice: 74,
          amount: 1000.0,
        },
      ],
    },
    {
      id: 51,
      number: 2,
      date: '2024-11-26',
      contact: 37,
      amount: 1000.0,
      balance: 1000.0,
      account: 1197,
      reference: null,
      notes: null,
      items: [],
    },
  ],
  meta: {
    page: 1,
    perPage: 50,
    totalResults: 2,
    totalPages: 1,
  },
};

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

const ALT_MULTI_OBJECT_RESPONSE = {
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
  "invoices": [
      {
          "id": 75,
          "date": "2024-11-28",
          "number": "1001",
          "customer": 37,
          "terms": 0,
          "isPaid": false,
          "notes": "",
          "total": 2550.0,
          "balance": 2550.0,
          "items": [
              {
                  "id": 91,
                  "product": 15,
                  "name": "Management Fee",
                  "description": "",
                  "quantity": 30.0,
                  "unitPrice": 85.0
              }
          ]
      },
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
          "items": [
              {
                  "id": 90,
                  "product": 16,
                  "name": "Carpark Fee",
                  "description": "",
                  "quantity": 2.0,
                  "unitPrice": 900.0
              }
          ]
      }
  ],
  "meta": {
      "page": 1,
      "perPage": 50,
      "totalResults": 2,
      "totalPages": 1
  }
}

const ARRAY_VALUE_RESPONSE = {
  "posts": [
    {
      "id": 1,
      "name": "Post 1",
      "type": "Type A",
      "observers": [2],
      "contact": 101,
    },
    {
      "id": 2,
      "name": "Post 2",
      "type": "Type B",
      "observers": [1],
      "contact": 100
    }
  ],
  "contacts": [
    {
      "id": 100,
      "name": "Contact 100",
    },
    {
      "id": 101,
      "name": "Contact 101",
    },
    {
      "id": 102,
      "name": "Contact 102",
    }
  ],
  "observers": [
    {
      "id": 1,
      "name": "Observer 1",
      "contact": 100,
    },
    {
      "id": 2,
      "name": "Observer 2",
      "contact": 101,
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

  it("should merge sideload data with multiple values into an array of detail objects", () => {
    const posts = sideloadToComposite(
      JSON.parse(JSON.stringify(ARRAY_VALUE_RESPONSE)),
      'posts', 'id');
    expect(posts).toBeTruthy();
    expect(posts[0]['observers']).toBeTruthy();
    expect(posts[0]['observerDetails']).toBeTruthy();
    expect(posts[0]['observerDetails'].length).toEqual(1);
    expect(posts[0]['observerDetails'][0]['name']).toEqual('Observer 2');
    expect(posts[1]['observerDetails']).toBeTruthy();
    expect(posts[1]['observerDetails'].length).toEqual(1);
    expect(posts[1]['observerDetails'][0]['name']).toEqual('Observer 1');
  });

  it("should return unmerged data when sideload keys don't match (append)", () => {
    const invoices = sideloadToComposite(
      JSON.parse(JSON.stringify(ALT_MULTI_OBJECT_RESPONSE)),
      'invoices', 'id');
    expect(invoices).toBeTruthy();
    expect(invoices[0]['contactDetail']).toBeFalsy();
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

  it('should recursively merge sideload data into an array of composite objects (append)', () => {
    const customerPayments = sideloadToComposite(
      JSON.parse(JSON.stringify(MULTI_OBJECT_RESPONSE)),
      'customerPayments',
      'id',
      'append',
      'Detail',
      [
        ['customer', 'contacts'],
        ['account', 'accounts'],
      ]
    );
    expect(customerPayments).toBeTruthy();
    expect(customerPayments[0]['contactDetail']).toBeTruthy();
    expect(customerPayments[0]['accountDetail']).toBeTruthy();
    // inner level merge - contact -> account => contact -> accountDetail
    expect(customerPayments[0]['contactDetail']['accountDetail']).toBeTruthy();
    expect(customerPayments[0]['contactDetail']['account']).toEqual(
      customerPayments[0]['contactDetail']['accountDetail']['id']
    );
    expect(customerPayments[0].items[0]['invoiceDetail']).toBeTruthy();
  });


});
