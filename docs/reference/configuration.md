---
title: Configuration
---

Vaulty can be configured using CLI flags or environment variables. You can use both CLI flags or environment variables, but flags take precedence.

To run Vaulty in a proxy mode use **proxy** command:

```
./vaulty proxy
```

It will work out of the box without any configuration.

## Configuration variables

### Encryption

Please, check [encryption backends](./encryption-backends) section to see how to configure Vaulty encryption.

### Hash Salt

- Environmental Variable: HASH_SALT
- CLI flag: `--hash-salt`
- Type: `string`
- Default: N/A

Salt is used by hash action to force uniqueness of resulting checksum.

### Proxy Password

- Environmental Variable: `PROXY_PASS`
- CLI flag: `--proxy-pass` or `-p`
- Type: `string`
- Default: random value will be generated on start

Proxy password will be used for forward proxy authentication. Provided user ("x") is ignored.

**Warning!** Only HTTPS proxy (accessed by CONNECT method) supports proxy authentication. HTTP proxy does not support it.

```shell
curl -x http://x:proxy_password@127.0.0.1:8080 https://whatever.com
```

### Routes File

- CLI flag: `--routes-file` or `-r`
- Type: `string`
- Default: `./routes.json` - load routes from current directory

Routes file sets file name with the routes information. Here is how you can set it via CLI:

```shell
./vaulty proxy -r ./routes.json
```

### CA Path

- Environmental Variable: `CA_PATH`
- CLI flag: `--ca-path` or `--ca` (double --)
- Type: `string`
- Default: `~/.vaulty`

CA Path directory is a path in which Vaulty will look for ca.key (private key) and ca.pem (certificate) files for TLS certificate signing. Vaulty will generate both ca.key or ca.pem files if one of them was not found in CA Path.

### Proxy Address

- CLI flag:  `--address` or `-a`
- Default: `:8080`

Specifies address for Vaulty proxy.

### Debug mode

- CLI flag:  `--debug`
- Default: false

In debug mode Vaulty dumps request and response bodies of json, form and plain/text requests with POST, PUT and PATCH methods. It also adds some debug information about routing and so on. **Do not use this in production as you may expose sensitive data!**


## Examples

Here is the example:	

```shell
PROXY_PASS=12345678 ./vaulty proxy --ca-path ./ca
```
