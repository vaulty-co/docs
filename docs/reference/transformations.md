---
title: Transformations
---

Vaulty transforms request or response based on provided list of transformations. Transformation specifies element for transformation and action that will be performed on this element. Type of transformation should be provided in "type" attribute:

```json
{
	"type": "json",
  ...
}
```

Following transformation types are supported:

- json - transforms request or response body performing action on element specified by path

Each transformation has own set of attributes. Also, transformation may have an action like tokenize, encrypt, decrypt, etc. Please, check Actions for more information.

### Json

Each json transformation will try to perform action on element specified by path. If body is not a valid json, then action will not be performed and body will stay as is.

Json transformation has attribute **expression** which specifies path of element for transformation. A path is in dot syntax, such as "user.email" or "card.number". Vaulty uses [gjson](https://github.com/tidwall/gjson) and [sjson](https://github.com/tidwall/sjson) Go packages to modify json document. For complete information please check [GJSON Syntax](https://github.com/tidwall/gjson/blob/master/SYNTAX.md). Here are how path may look like:

```
card.number
user.email
fav\.movie # use \ to escape * or .
emails.1 # use index to access element of array
c?rd.number # special wildcard characters '*' and '?' can be used
```

Please note that currently the result of expression must be a string. Array, object, number, boolean values will be ignored.

Here is format of json transformation:

```json
{
	"type": "json",
	"expression": "card.number",
  "action": {
		"type": "encrypt"
  }
}
```

### Regexp

Regexp transformation will find submatch specified by "submatch_number" of the expression and performs action on it.  Here is an example:

```json
{
	"type": "regexp",
	"expression": "number: \d(\d+)\d{4}",
  "submatch_number": 1,
  "action": {
		"type": "mask"
  }
}
```

Body with content

```
number: 4242424242424242
```

will be transformed into

```
number: 4xxxx4242
```

## Actions
