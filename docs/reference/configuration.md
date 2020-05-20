---
title: Configuration
---

Vaulty can be configured using a configuration file or environment variables. In general, environmental variable keys are identical to config file keys but are in uppercase. You can use both configuration file or environment variables, but environment variables take precedence.

## Configuration variables

## Configuration file

* CLI argument: `-c` or `--config`
* Default: `vaulty.yml`

Vaulty configuration file. Example:

```she
./vaulty --config conf.yml
```

### Encryption Key

- Environmental Variable: `ENCRYPTION_KEY`
- Config File Key: `encryption_key`
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
- Config File Key: `proxy_pass`
- Type: `string`
- Default: random value will be generated on start

Proxy password will be used for forward proxy authentication. User value is ignored.

```shell
curl -x http://x:proxy_password@127.0.0.1:8080 https://whatever.com
```

### Routes File

- Environmental Variable: `ROUTES_FILE`
- Config File Key: `routes_file`
- CLI argument: `--routes-file`
- Type: `string`
- Default: `./routes.json` - load routes from current directory

Routes file sets file name with the routes information. Here is how you can set it via CLI:

```shell
./vaulty proxy --routes-file ./routes.json
```

### CA Path

- Environmental Variable: `CA_PATH`
- Config File Key: `ca_path`
- Type: `string`
- Default: `~/.vaulty`

CA Path directory is a path in which Vaulty will look for ca.key (private key) and ca.pem (certificate) files for TLS certificate signing. Vaulty will generate both ca.key or ca.pem files if one of them was not found in CA Path.

### Proxy Port

- CLI argument: -p `--port`
- Default: `8080`

Specifies port for Vaulty proxy.


## Examples

Here is the example of configuration file:

```yaml
proxy_pass: pass123
ca_path: ~/.vaulty
routes_file: ~/.vaulty/routes.json
```

or here is how you can pass environment variables:

```shell
CA_PATH=${PWD} PROXY_PASS=12345678 ./vaulty proxy
```
