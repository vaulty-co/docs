---
title: Actions
---

Vaulty may perform the following actions on elements:

- encrypt / decrypt
- tokenize / detokenize
- mask

## Encrypt / Decrypt

Currently, Vaulty supports built-in encryption with AES GCM and 256-bit key. To use encryption you have to configure Encryption Key first (see [Configuration](./configuration#encryption-key)). 

Generate encryption key:

```
openssl rand -hex 16
```

outputs:

```
9907848674fbc8713dc5981a0e2d3963
```

Provide the Encryption Key to the Vaulty proxy via environment variable:

```
ENCRYPTION_KEY=9907848674fbc8713dc5981a0e2d3963 ./vaulty proxy
```

Encrypted value is hex encoded string. The original and encoded values differ in length.

If Encryption Key is not provided, then Base64 encoding will be used. This is not secure and is acceptable only for demo / development purposes.

This is how you can encrypt `user.password` element:

```json
{
  "type":"json",
  "expression":"user.password",
  "action":{
    "type":"encrypt"
  }
}
```
For this request:

```shell
curl http://127.0.0.1:8080/post \
  -d '{ "user": { "password": "12345678", "email": "john@example.com" } }' \
  -H "Content-Type: application/json"

```

You can see the result of transformation (and encryption):

```json
{
  "user":{
    "password":"85c22c81779de93991f2e2b145e9dfd597bd7fd5a2f233ae0140809ee11189f8ee697b4c",
    "email":"john@example.com"
  }
}
```

`decrypt` action will decrypt element specified by `expression`.

## Mask

Using mask action you can replace value with placeholder (`*` by default). In "symbol" attribute you can set custom placeholder value:

```json
{
  "type":"mask",
  "symbol":"x"
}
```

Here are some examples of how you can mask values.

Mask the whole value of **json** path element:

```json
{
  "type":"json",
  "expression":"user.password",
  "action":{
    "type":"mask"
  }
}
```

Result of transformation:

```json
{
  "user":{
    "password":"********",
    "email":"john@example.com"
  }
}
```

Mask data with **regexp** transformation:

```json
{
  "type":"regexp",
  "expression":"number: \\d{1}(\\d+)\\d{4}",
  "submatch_number":1,
  "action":{
    "type":"mask",
    "symbol":"x"
  }
}
```

For this request:

```shell
curl http://127.0.0.1:8080/post -d "number: 4242424242424242"
```

The result of transformation is:

```
number: 4xxxxxxxxxxx4242
```

## Tokenize / Detokenize

In Vaulty tokenization action does two things. First, it encrypts the value of transformation. Second, it stores encrypted value in secure storage (currently ephemeral in memory storage only supported) and tags it with generated token (think ID in database).

Generated token is a random set of characters prefixed with tok, e.g.: `tokbr2euteg10l4dq9k8u4g10l4`.

Here is the transformation with tokenize action:

```json
{
  "type":"json",
  "expression":"user.email",
  "action":{
    "type":"tokenize"
  }
}
```

For this request:

```shell
curl http://127.0.0.1:8080/post \
  -d '{ "user": { "password": "12345678", "email": "john@example.com" } }' \
  -H "Content-Type: application/json"
```

The result of transformation:

```json
{
  "user":{
    "password":"12345678",
    "email":"tokbr2f7iug10l5ctl1r3j0"
  }
}
```

Action **detokenize** performs the opposite. First, it looks encrypted value in storage by provided token. Second, it decrypts the value.




