---
title: Reverse proxy
---

Using Vaulty as a reverse proxy means that client sends requests directly to Vaulty without knowing where they end up. Vaulty forwards transformed requests to the upstream of the matched route and returns transformed response back to the client.


<img src="/img/reverse.svg"/>

Let's look at an example:

```json
{
  "routes":[
    {
      "name":"in",
      "method":"POST",
      "url":"/cards",
      "upstream":"https://payments-backend.int",
      "request_transformations":[
        {
          "type":"json",
          "expression":"card.number",
          "action":{
            "type":"encrypt"
          }
        }
      ]
    }
  ]
}
```

Vaulty will add request path to the upstream, so the final destination URL will look as follows:

```
https://payments-backend.int/cards

```