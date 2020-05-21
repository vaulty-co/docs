---
title: Transformations
---

Vaulty transforms request or response body based on provided list of transformations. Transformation specifies element for transformation and action that will be performed on this element. Here is an example of transformation:

```json
{
  "type":"json",
  "expression":"card.number",
  "action":{
    "type":"encrypt"
  }
}
```

Type of transformation should be set in `type` attribute. Following transformation types are supported:

- json - use selector (a-la JSON path) to find element for transformation
- regexp - use regular expressions to find what should be transformed 

Each transformation has its own set of attributes.

### Json

Each json transformation will try to act on the element specified by path. If the body is not a valid JSON, then the action is not performed and body stays as is.

Json transformation has attribute **expression** which specifies the path of element for transformation. A path is in dot syntax, such as "user.email" or "card.number". Vaulty uses [gjson](https://github.com/tidwall/gjson) and [sjson](https://github.com/tidwall/sjson) Go packages to modify JSON document. For complete information on path syntax, please check [GJSON Syntax](https://github.com/tidwall/gjson/blob/master/SYNTAX.md). Here are how paths may look like:

```
card.number
user.email
fav\.movie # use \ to escape * or .
emails.1 # use index to access element of array
c?rd.number # special wildcard characters '*' and '?' can be used
```

Please note that currently the result of the expression must be a string. Array, object, number, boolean values will be ignored and transformation will not be performed.

### Regexp

Regexp transformation will find submatch specified by "submatch_number" of the expression and acts on it.  The "expression" attribute should contain a regular expression. Please note that backslash should be escaped like this: `\\`.

Here is an example:

```json
{
  "type":"regexp",
  "expression":"number: \\d(\\d+)\\d{4}",
  "submatch_number":1,
  "action":{
    "type":"mask"
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
