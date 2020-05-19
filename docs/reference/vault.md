---
title: Vault
---

Vaulty can work with multiple vaults. But it needs a way to separate requests for one vault from another. The way to do this is to run Vaulty on multiple domains, where subdomain will correspond to vault ID. Here is example of how it may look like: **vlt123456789.secureproxy.com**. Your DNS should be configured to forward all *.secureproxy.com to Vaulty's server.

By default Vaulty works with single vault and can be addressed by any domain, locahost or directly by IP.
