export const customerData = {
  "customer": {
    "customerId": "string",
    "name": {
      "first": "string",
      "middle": "string",
      "last": "string",
      "prefix": "string",
      "suffix": "string",
      "company": "string"
    },
    "businessCustomer": {
      "name": "string",
      "registeredAgents": [
        {
          "first": "string",
          "middle": "string",
          "last": "string",
          "prefix": "string",
          "suffix": "string",
          "company": "string"
        }
      ],
      "registeredId": "string",
      "industryCode": {
        "type": "string",
        "code": "string"
      },
      "domicile": {
        "region": "string",
        "country": "string"
      }
    },
    "addresses": [
      {
        "line1": "string",
        "line2": "string",
        "line3": "string",
        "city": "string",
        "state": "string",
        "region": "string",
        "postalCode": "string",
        "country": "string",
        "type": "string"
      }
    ],
    "telephones": [
      {
        "number": "string",
        "type": "HOME",
        "country": "string"
      }
    ],
    "email": [
      "string"
    ],
    "accounts": [
      {
        "accountId": "string",
        "relationship": "AUTHORIZED_USER"
      }
    ]
  }
}