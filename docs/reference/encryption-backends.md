---
title: Encryption Backends
---

Vaulty encrypts and decrypts the data using encryption backends. Encryption backend is specified in `VAULTY_ENCRYPTION_TYPE` environment variable. Currently following backends are supported:

* [none](#none) (used by default)
* [aesgcm](#aes-gcm) - AES GCM encryption with user provided encryption key
* [awskms](#aws-kms) - AES GCM encryption with encryption key provided and managed by AWS KMS

## None

Built-in backend that performs Base64 encoding and decoding. 

<img src="/img/reference/none-enc.gif"/>

It requires no setup and configuration that's why it works best for the demo and the development purposes. This backend should **NEVER** be used in the production. If you want, you can specify `none` encryption backend like this:

```bash
VAULTY_ENCRYPTION_TYPE=none 
```

## AES GCM

Build-in backend that uses AES encryption with GCM mode with 256-bit encryption key.

<img src="/img/reference/aes-gcm.gif"/>

To use AES GCM encryption set following environment variables:

```bash
VAULTY_ENCRYPTION_TYPE=aesgcm
VAULTY_ENCRYPTION_KEY=9907848674fbc8713dc5981a0e2d3963 # your encryption key
```

Encryption key must contain 32 chars. Generate encryption key:

```
openssl rand -hex 16
```

outputs something like this:

```
9907848674fbc8713dc5981a0e2d3963
```


## AWS KMS

AWS Key Management Service (KMS) makes it easy for you to create and manage cryptographic keys. 

<img src="/img/reference/aws-kms.gif"/>

### Configuration

To let Vaulty use AWS KMS for encryption, you must specify your AWS credentials, region, and master key ID.

Region and master key are set via environment variables:

```bash
VAULTY_ENCRYPTION_TYPE=awskms
VAULTY_ENCRYPTION_AWS_KMS_REGION=eu-central-1 # specify region of your master key
VAULTY_ENCRYPTION_AWS_KMS_KEY_ID=618242c3-...-0e0a9b2490d8 (or use alias)
VAULTY_ENCRYPTION_AWS_KMS_KEY_ALIAS=vaulty-demo (may be used instead of key ID)
```

#### Specifying AWS Credentials

AWS KMS encryption backend requires credentials (an access key and secret access key) to sign requests to AWS. You can specify your credentials in several different locations, depending on your particular use case. Here you can find [information about obtaining credentials](https://docs.aws.amazon.com/sdk-for-go/v1/developer-guide/setting-up.html).

Vaulty will look for credentials in the following order:

1. Environment variables.
2. Shared credentials file.
3. If Vaulty is running on an Amazon EC2 instance, IAM role for Amazon EC2.
4. If Vaulty uses an ECS task definition or RunTask API operation, IAM role for tasks.

If you have any issues with specifying the credentials, you can check the [AWS SDK for Go](https://docs.aws.amazon.com/sdk-for-go/v1/developer-guide/configuring-sdk.html#specifying-credentials) documentation for more details.
