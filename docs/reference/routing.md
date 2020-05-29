---
title: Routing
id: routing
---

For each incoming request Vaulty will go though loaded routes and try to find route for it. Here are the steps of how Vaulty will handle each request:

- Select the best fitting route by matching the request. When no route found, respond with 404.
- Execute the transformations defined in the route on the request body. The transformations may or may not modify the request.
- For inbound request
- Forward the request to the upstream defined by the route and receive a response.
- For outbound request
- Forward the request to it's target and receive a response.
- Execute the transformations defined in the route on the response body. The transformations may or may not modify the response.
- Respond to the incoming request with the resulting response.

## Route

Route describes how Vaulty will handle requests and responses. Currently, Vaulty loads routes from a JSON file with route definitions:

```
{
  "options":{
    "default_upstream":"https://postman-echo.com"
  },
  "routes":[
    {
      "name":"in",
      "method":"POST",
      "url":"/registration",
      "upstream":"https://auth.backend",
      "request_transformations":[
        {
          "type":"json",
          "expression":"user.email",
          "action":{
            "type":"encrypt"
          }
        }
      ]
    },
    {
      "name":"out",
      "method":"POST",
      "url":"https://api.sendgrid.com/v3/mail/send",
      "request_transformations":[
        {
          "type":"json",
          "expression":"personalizations.1.to.1.email",
          "action":{
            "type":"decrypt"
          }
        }
      ]
    }
  ]
}

```

## Route Definition

Here are the route definition attributes:

* `name` - is handful for debugging as Vaulty shows in logs which route is found for the request
* `method` - *required*, HTTP method of the request such as GET, POST, PUT, DELETE or *
* `url` - *required*, URL of the request. Outbound route should have absolute URL (with schema and host), inbound route should have relative URL and start from "/". Wildcards can be put in place of one or more path segments, e.g. "/list/*/something".
* `upstream` - used only for inbound routes. Default upstream from `otions.default_upstream` will be used if attribute is not provided.
* `request_transformations` - array of [transformations](./transformations) for the request
* `response_transformations` - array of [transformations](./transformations) for the response

### Inbound / Outbound

If you are familiar with reverse/forward proxies, then think about inbdound requests as reverse proxy requests and outbound requests as forward proxy requests.

Other way to think about it is when http(s) client makes request to Vaulty without knowing where the request ends up then it's inbound request. When http(s) client uses Vaulty as a proxy and request destination is some other URL like https://api.stripe.com then it's outbound request.

Use case for inbound route is an API gateway. You can route requests to different backends inside your network. Client knows abount Vauly only.

Use case for outbound route is when your server needs to connect 3rd party service. By setting Vaulty as a proxy host Vaulty will be able to transform requests to this 3rd party service.

## Route Matching

Request that matches the `method` and `url` of a route will be transformed based on the transformations of that route.

`method` can be any HTTP method or * meaning any method. You can also tak advantage of * and ** glob support. Under the hood Vaulty uses Golang [filepath.Match](https://golang.org/pkg/path/filepath/#Match) to match glob patterns of `url`.

When no route found, Vaulty will respond with 404 status code. If you want to pass all requests to specific upstream (inbound) or url (outbound) you can create route for all requests like this:

```
{
  "name":"route for unmatched inbound requests",
  "method":"*",
  "url":"/*",
  "upstream":"https://backend.com"
},
{
  "name":"route for unmatched outbound requests",
  "method":"*",
  "url":"https://api.stripe.com/*"
}
```

