---
title: Actions
---

Routing

The routing executes the following steps in the typical case:

- Select the best fitting route by matching the request against the predicates. When no route found, respond with 404 (unless the default status code is configured to a different value).
- Execute the filters defined in the route in normal order on the request. The filters may or may not alter the request.
- Forward the request to the backend defined by the route and receive a response.
Execute the filters defined in the route in reverse order on the response. The filters may or may not alter the response.

Respond to the incoming request with the resulting response.
