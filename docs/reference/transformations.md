---
title: Transformations
---

Vaulty transforms request or response body based on provided list of transformations. Transformations are specified in the route description in the `request_transformations` and `response_transformations` attributes:

```
{
  "routes":[
    {
      ...
      "request_transformations":[
        {
          "type":"json",
          "expression":"user.email",
          "action":{
            "type":"encrypt"
          }
        }
      ],
      "response_transformations": [
         {
          "type":"json",
          "expression":"user.email",
          "action":{
            "type":"encrypt"
          }
        }     
      ]
    }
  ]
}
```

## 

Transformation specifies element for transformation and action that will be performed on this element. Here is an example of transformation:

```json
{
  "type":"json",
  "expression":"card.number",
  "action":{
    "type":"encrypt"
  }
}
```

Type of transformation should be set in `type` attribute in lowercase. Following transformation types are supported:

- [json](#json) - uses selector (a-la JSON path) to find element for transformation
- [regexp](#regexp) - uses regular expressions to find what should be transformed
- [form](#form) - uses field names of HTML form or multipart request for transformation

Each transformation has its own set of parameters.

### JSON

JSON transformations are performed on requests and responses with `application/json` content type. Each JSON transformation will try to act on the element of JSON document specified by path. If the body is not a valid JSON, then the action is not performed and request or response stays as is. If the result of expression is an array, then each string value of array will be transformed.

**JSON transformation params**:

* `expression` - specifies the path of JSON element for transformation.

Here is an example:

```json
{
  "type":"regexp",
  "expression":"card.number",
  "action":{
    "type":"tokenize"
  }
}
```

A path is in dot syntax, such as "user.email" or "card.number". Vaulty uses [gjson](https://github.com/tidwall/gjson) and [sjson](https://github.com/tidwall/sjson) Go packages to modify JSON document. Path syntax for Vaulty is a mix of [GJSON Syntax](https://github.com/tidwall/gjson/blob/master/SYNTAX.md) and [SJSON Syntax](https://github.com/tidwall/sjson#path-syntax) with the following restrictions:

* only *string* values are transformed, if the result of expression is not a string, then transformation will not be performed
* only *one level* is supported in array expression
* *no wildcard* characters are allowed in expression (`*`, `?`)

Example of paths:

```
card.number
user.email
data.users.#.email
emails.1 # use index to access element of array
users.#.email # emails of all users
```

### Regexp

Regexp transformations are performed on requests and responses regardless of the content type. Regexp transformation will find submatch specified by "group_number" of the regular expression and acts on it. All matches will be transformed.

**Regexp transformation params**:

* `expression` - valid regular expression (check [syntax](https://github.com/google/re2/wiki/Syntax)). Backslash should be escaped: `\\`
* `group_number` - capturing group number (submatch) that will be transformed.

Here is an example:

```json
{
  "type":"regexp",
  "expression":"number: \\d(\\d+)\\d{4}",
  "group_number":1,
  "action":{
    "type":"mask"
  }
}
```

Body with content

```
number: 4242424242424242 and number: 1234567890
```

will be transformed into

```
4xxxxxxxxxxx4242 and number: 1xxxxx7890
```

### Form

Form transformation may transform HTML form data or other data sent with the following content types:

* `application/x-www-form-urlencoded` 
* `multipart/form-data` 

Typically it's a POST request via HTML form or sending body of email via API.

**Form transformation params**:

* `fields` - single field name or list of field names for transformation separated by comma (e.g., "field1, field2, field3")

If specified field is an array, then each value of array will be transformed.

Here is an example of form transformation that will encrypt phone, ssn and address fields of submitted form:

```json
{
  "type":"form",
  "fields":"phone, ssn, address",
  "action":{
    "type":"encrypt"
  }
}
```
