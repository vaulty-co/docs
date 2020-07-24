---
title: Storage Backends
---

Vaulty supports the following storage backends for the storage of tokenized data:

* [in-memory](#in-memory)
* [redis](#redis)

Storage backend is set via ```VAULTY_STORAGE_TYPE``` environment variable.

## In-Memory

The In-Memory storage backend is used to store tokenized data in memory of the
running Vaulty application. It's only useful for testing and development
purposes. All data is lost when Vaulty restarts.

### Configuration


The In-Memory storage is used by default when no other storage is specified. It can also be set via the environment variable like this:

```bash
VAULTY_STORAGE_TYPE=memory
```


## Redis

The Redis storage backend is used to store tokenized data in a [Redis](https://redis.io/) server.

<img src="/img/reference/redis-storage.gif"/>

### Configuration

The connection URL is set using the ```REDIS_URL``` environment variable. Here is how you can configure redis storage backend:

```bash
VAULTY_STORAGE_TYPE=redis
REDIS_URL=redis://foo:bar@localhost:123
```

The connection URL format:

```
redis://[:password@]host[:port][/db-number]
# or with TLS
rediss://[:password@]host[:port][/db-number]
```

_Options passed via query params are not supported._
