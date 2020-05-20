---
title: Forward Proxy
---

Forward proxy is used when requests via proxy go outside of your network. Vaulty creates tunnel between your client and target server. The main difference between forward proxy and [reverse proxy](./reverse-proxy) is that for the latter client can't specify the destination. Destination for reverse proxy is taken from the routes file, while the destination for the forward proxy is specified by client. Here is an example:

```shell
curl -x https://proxy.vaulty.co:8080 https://example.com
```

In this example we tell curl to use vaulty as a forward proxy and send request at `example.com`.

## Proxy Authentication

All requests to forward proxy should be authenticated with "x" as a user name and a password. Proxy password should be set via environment variable **PROXY_PASS** or via config file. Here is an example:

```bash
PROXY_PASS=12345678 ./vaulty proxy
```

Now provide password with proxy request:

```bash
curl --cacert ./ca.pem -x https://x:12345678@proxy.vaulty.co:8080 https
://google.com
```

## Transformation of TLS encrypted data

Forward proxy opens a pipe between client and server and can neither view or manipulate a TLS-encrypted data stream between them. Proxy just forwards data in both directions without knowing anything about the contents.

So, how does Vaulty can transform requests and responses then? Here is MITM (Man-In-The-Middle) trick comes into play. Basically, we pretend to be the server to the client, and pretend to be the client to the server, while we sit in the middle decoding traffic from both sides. 

To make it work Vaulty needs CA root certificate and private key that will be used to generate and sign legit TLS certificate for our MITM server. You can provide CA root certificate and private key by [configuring CA Path](./configuration#ca-path). Vaulty will generate CA certificate and key if they are not provided.

Here is how you can generate you own CA:

Generate private key:

```bash
openssl genrsa -out ca.key 2048
```

Generate certificate:

```bash
openssl req -new -x509 -key ca.key -out ca.pem
```

For all your clients that will use Vaulty forward proxy you have to share ca.pem with them and they have to configure their HTTP clients to use ca.pem as CA certificate.