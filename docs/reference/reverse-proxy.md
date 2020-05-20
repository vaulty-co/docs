---
title: Reverse proxy
---

Using Vaulty as reverse proxy means that client sends requests directly to Vaulty without knowing where they end up. Vaulty forwards transformed requests to the upstream of matched route and returns transformed response back to the client. If no upstream for the route set then default upstream is used.

Let's look at an example.

`vault.upstream` sets default destination for requests that didn't match any route. As well for requests that do not set own upstream:

```json
{
    "vault":{
        "upstream":"https://default-backend.int/"
    },
    "routes":{
        "inbound":[
            {
                "method":"POST",
                "path":"/token",
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
}
```

This route sets own upstream, so all matched requests are sent to this upstream:

```json
{
    "vault":{
        "upstream":"https://default-backend.int/"
    },
    "routes":{
        "inbound":[
            {
                "method":"POST",
                "path":"/register",
                "upstream":"https://auth-backend.int",
                "request_transformations":[
                    {
                        "type":"json",
                        "expression":"user.password",
                        "action":{
                            "type":"encrypt"
                        }
                    }
                ]
            }
        ]
    }
}
```

Vaulty will add request path to the upstream, so final destination URL will look as following:

```
https://auth-backend.int/register
```
