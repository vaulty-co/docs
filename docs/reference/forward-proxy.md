---
title: Forward Proxy
---

Forward proxy is used when request via proxy goes outside of your network. Vaulty creates tunnel between your client and target server. The main difference between forward proxy and reverse proxy is that for the latter can't specify the destination. Destination for reverse proxy is taken based on configuration or set of rules. Vaulty, for instance, will take target from created route and send your request to it.

your network, client with target → { Vaulty } → target

client with vaulty address → { Vaulty } → route target

During data transfer Vaulty may modify request and response body. In order to do this we need to decode data you send to target. After data is modified we encode it again and send to target. For Vaulty to work as a forward proxy you need to use CA certificate that will be used for signing TLS certificates for target domains.

???You can pass CA certificate to Vaulty by specifying it via config file or via environment variables....

## Proxy Authentication

All requests to forward proxy should be authenticated with vault ID as a user name and a password. Proxy password should be set via environment variable **PROXY_PASS** or via config file. Here is an example:

```bash
PROXY_PASS=12345678 ./vaulty proxy
==> Vaulty proxy server started on port 8080! in production environment
```

Now provide password with proxy request:

```bash
curl --cacert ~/.vaulty/ca.pem -x https://vltbqk5p5mg10l50cmr89eg:12345678@proxy.vaulty.co:8080 https
://google.com
```

## Transformation of TLS encrypted data

Forward proxy opens a pipe between client and server and can neither view or manipulate a TLS-encrypted data stream between them. Proxy just forwards data in both directions without knowing anything about the contents.

So, how does Vaulty can transform requests and responses then? Here is MITM (Man-In-The-Middle) trick comes into play. Basically, we pretend to be the server to the client, and pretend to be the client to the server, while we sit in the middle decoding traffic from both sides. 

To make it work Vaulty needs CA root certificate and private key that will be used to generate and sign legit TLS certificate for our MITM server. You can provide CA root certificate and private key by setting CA_PATH environment variable or setting ca_path in config file. Vaulty will look for ca.pem and ca.key files in specified directory. If path to CA files is not set Vaulty will check ~/.vaulty directory.

Here are examples on how you can generate you own CA:

Generate private key:

```bash
openssl genrsa -out ca.key 2048
```

Generate certificate:

```bash
openssl req -new -x509 -key ca.key -out ca.pem
```

For all your clients that will use Vaulty forward proxy you have to use ca.pem as CA certificate. Here is an example with curl:

```bash
curl --cacert ~/.vaulty/ca.pem -x http://vltbqk5p5mg10l50cmr89eg:pass@proxy.vaulty.co:8080 https://google.com
```
