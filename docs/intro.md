---
id: intro
title: Introduction
sidebar_label: Introduction
---
Vaulty is an HTTP reverse and forward proxy that performs the modification (encrypt, mask, tokenize) of the request and response bodies on the fly.

<img src="/img/flow.svg"/>

Vaulty can be used for the following:

- Anonymize data before it reaches your APIs and backends
- Get encryption/decryption for your APIs without changing a line of code
- Provide filtered data for a specific group of users like support staff, etc.
- Tokenize credit cards, SSNs, etc. for companies that are PCI compliant
- Encrypt your customers' data when you import this data from 3d party services (access tokens, PII, etc.)


Currently you can play with Vaulty, think about how you would like to use it, and [share your ideas and feedback](https://github.com/vaulty-co/vaulty/issues) so we can make it work for you. It's not ready for production yet.


## Routes

Routes are the heart of the Vaulty. Routes describe when and how Vaulty should perform transformations. Currently, Vaulty identifies routes based on the HTTP requests’ properties, such as path and method. When you run Vaulty it needs to load information about routes. Let's look at the routes file with the transformations:

```json
{
  "vault":{
    "upstream":"https://api.yourbackend.com"
  },
  "routes":{
    "inbound":[
      {
        "method":"POST",
        "path":"/cards",
        "request_transformations":[
          {
            "type":"json",
            "expression":"card.number",
            "action":{
              "type":"tokenize"
            }
          },
          {
            "type":"json",
            "expression":"card.cvc",
            "action":{
              "type":"tokenize"
            }
          }
        ]
      }
    ],
    "outbound":[
      {
        "method":"POST",
        "path":"https://api.stripe.com/v1/tokens",
        "request_transformations":[
          {
            "type":"json",
            "expression":"card.number",
            "action":{
              "type":"detokenize"
            }
          },
          {
            "type":"json",
            "expression":"card.cvc",
            "action":{
              "type":"detokenize"
            }
          }
        ]
      }
    ]
  }
}
```

Routes file describes transformations of inbound ([reverse proxy](./reference/reverse-proxy)) and outbound ([forward proxy](./reference/forward-proxy)) requests and responses.

In this file, we specify the default upstream for inbound routes: all inbound requests are forwarded to upstream: https://api.yourbackend.com.

In the routes section we describe one inbound route for POST requests with /cards path. Body of such requests will be transformed as follows:

- the element of JSON request body **card.number** will be tokenized
- the element of JSON request body **card.cvc** will be tokenized

The outbound route in this file describes the opposite. In requests that go to [https://api.stripe.com/v1/tokens](https://api.stripe.com/v1/tokens) Vaulty replaces elements of JSON request body such as **card.number** and **card.cvc** with their original values and pass the resulting JSON to the destination.
