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

### Encryption Key

- Environmental Variable: `ENCRYPTION_KEY`
- CLI flag: `--key` or `-k`
- Type: `string`
- Default: N/A

Encryption key is used by encrypt and decrypt actions. Encryption key must contain 32 chars. If not provided then Base64 encoding  will be used for demo purposes.

Generate encryption key:

```
openssl rand -hex 16
```

outputs:

```
9907848674fbc8713dc5981a0e2d3963
```

### Proxy Password

- Environmental Variable: `PROXY_PASS`
- CLI flag: `--proxy-pass` or `-p`
- Type: `string`
- Default: random value will be generated on start

Proxy password will be used for forward proxy authentication. Provided user ("x") is ignored.

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


## Examples

Here is the example:	

```shell
PROXY_PASS=12345678 ./vaulty proxy --ca-path ./ca
```
