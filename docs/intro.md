---
id: intro
title: Introduction
sidebar_label: Introduction
---
Vaulty is an HTTP reverse and forward proxy that performs the modification (encrypt, mask, tokenize) of the request and response bodies on the fly and securely stores it in a safe. Vaulty can be used for the following:

- Anonymize data before it reaches your APIs and backends
- Get encryption / decryption for your APIs without changing a line of code
- Provide filtered data for specific group of users like support stuff, etc.
- Tokenize credit cards, SSNs, etc. for companies that are PCI compliant
- Encrypt your customers data when you import this data from 3d party services (access tokens, PII, etc.)

## Routes

Routes are the heart of the Vaulty. Routes describe when and how Vaulty should perform transformations. Currently, Vaulty identifies routes based on the HTTP requests’ properties, such as path and method. When you run Vaulty it needs to load information about routes. Let's look at the routes file with the transformations:

```json
{
	"vault": {
		"upstream": "https://api.yourbackend.com"
	},
	"routes": {
		"inbound": [
			{
				"method": "POST",
				"path": "/cards",
				"request_transformations": [
					{
						"type": "json",
						"expression": "card.number",
						"action": { "type": "tokenize" }
					},
					{
						"type": "json",
						"expression": "card.cvc",
						"action": { "type": "tokenize" }
					}
				]
			}
		],
		"outbound": [
			{
				"method": "POST",
				"path": "https://api.stripe.com/v1/tokens",
				"request_transformations": [
					{
						"type": "json",
						"expression": "card.number",
						"action": { "type": "detokenize" }
					},
					{
						"type": "json",
						"expression": "card.cvc",
						"action": { "type": "detokenize" }
					}
				]
			}
		]
	}
}
```

Routes file describes transformations of inbound (reverse proxy) and outbound (forward proxy) requests and responses.

In this file, we specify the default upstream for inbound routes: all inbound requests are forwarded to vault's upstream: https://api.yourbackend.com.

In routes section we describe one inbound route for POST requests with /cards path. Body of such requests will be transformed as following:

- element of json request body **card.number** will be tokenized
- element of json request body **card.cvc** will be tokenized

Outbound route in this file describes the opposite. In requests that goe to [https://api.stripe.com/v1/tokens](https://api.stripe.com/v1/tokens) Vaulty replaces elements of json request body such as **card.number** and **card.cvc** with their original values and pass the resulting json to the destination.
