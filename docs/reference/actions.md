---
title: Actions
---

Vaulty may perform following actions with elements:

- mask
- encrypt / decrypt
- tokenize / detokenize

## Mask

Using mask action you can replace value with asterisks. E.g. 1234 will be replaced with ****. You can specify a symbol to be used as replacer:

```json
{
	"type": "mask",
	"symbol": "x"
}
```

## Encrypt / Decrypt

WIP.... Vaulty may perform encryption or decryption of elements. To do this, you have to configure encryption engine by setting ecnryption key, type, etc.
