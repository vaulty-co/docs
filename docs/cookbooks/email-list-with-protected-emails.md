---
id: email-list-with-protected-emails
title: An email list without emails
---


In this cookbook, we'll see how you can use Vault to maintain an email list without ever storing any emails in plaintext!

![Vaulty Cookbook: An email list without emails](/img/cookbooks/demo-front.png)

We put together a demo app that asks users for their email, and sends an email confirmation via Mailgun.

Our goal is to modify the current app to achieve the following:
1. Pseudonymize all emails in our database (replace them with tokens)
2. Encrypt and store the emails in isolated storage (managed by Vaulty)
3. Prevent application developers from accessing plain emails.

The best part, as you'll soon see, is that this entire change can be performed **without changing any code**.

Skeptical? Let's fix that.

## Code <span class='pill'>before Vaulty</span>

> The entire source code of the demo app can be found [here](https://github.com/vaulty-co/demo-collect-emails). We've kept things simple, so the repository only contains the code necessary for this working demo.

The architecture is pretty much what you'd expect:

<p class="text--center"><img src="/img/cookbooks/demo-app-arch.svg" height="481"/></p>

1. A user submits his email through the browser to our backend
2. The backend saves the email in a database
3. The backend sends a confirmation email via [Mailgun](https://www.mailgun.com/)

### 1. User submits email

We have a [simple form](https://github.com/vaulty-co/demo-collect-emails/blob/master/static/index.html#L74) for collecting emails, that gets submitted to `/subscribe`:

```html
<!-- ./static/index.html -->
<form action="/subscribe" method="post">
  ...
  <input type="email" name="email" class="form-control u-full-width" placeholder="Enter your email" required>
  <input type="submit" class="btn u-full-width" value="Subscribe">
  ...
</form>
```

### 2. Store the email in our database

Our [Go backend](https://github.com/vaulty-co/demo-collect-emails/blob/master/main.go) handles the incoming requst:

```go
// ./main.go
r.Post("/subscribe", func(w http.ResponseWriter, r *http.Request) {
  address := r.FormValue("email")

  // save email in DB
  db.Save(email{address})

  // send confirmation email
  err := sendConfirmationEmail(address)
  if err != nil {
    fmt.Printf("Error: %s\n", err.Error())
    w.Write([]byte("Error"))
    return
  }

  http.Redirect(w, r, "/success.html", 301)
})
```

### 3. Send email confirmation

We use the standard [Mailgun Go library](https://github.com/mailgun/mailgun-go/) to send the confirmation email:

```go
// ./main.go
func sendConfirmationEmail(to string) error {
  // create Mailgun client using env variables (MG_API_KEY, MG_DOMAIN)
  mg, err := mailgun.NewMailgunFromEnv()
  if err != nil {
    return err
  }

  // create message with recipient "to"
  m := mg.NewMessage("Sender <sender@vaulty.co>", "Confirmation Email", "Your subscription is confirmed!", to)

  // set timeout to 30 seconds
  ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
  defer cancel()

  // send message
  _, _, err = mg.Send(ctx, m)
  return err
}
```

### Running the app

Let's create a `.env` file with the environment variables we need:

```bash
# .env
MG_DOMAIN=mg.yourdomain.com
MG_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxx
```

These are:
* `MG_DOMAIN` - Your Mailgun domain
* `MG_API_KEY` - Mailgun [API Key](https://help.mailgun.com/hc/en-us/articles/203380100-Where-Can-I-Find-My-API-Key-and-SMTP-Credentials-)

Once you've added your enviroment variables, you can launch the app using `docker-compose up`:

```shell
git clone https://github.com/vaulty-co/demo-collect-emails
cd demo-collect-emails
docker-compose up
```

Now navigate to http://127.0.0.1:3000 to see the subscription form:

![result](/img/cookbooks/result.png)

You can access the final screen at http://127.0.0.1:3000/subscribers &mdash; it shows a dump of all of the subscribers stored in our database.

It's time to protect user's data! Let's add Vaulty to the demo app.

## Adding Vaulty 💪

There are two things we'd need to do to wire Vaulty in:
1. Pseudonymize (tokenize and encrypt) the user's email **before** passing it to the backend
2. Detokenize the email **before** it's sent to Mailgun

This is what our updated architecture diagram would look like once this change is done:

![result](/img/cookbooks/arch.svg)

To implement this change, we'll need to update the `docker-compose.yml` file to add Vaulty:

```yaml
# ./docker-compose.yml
version: '2.0'
services:
  backend:
    build: .
    command: ./main -port 3000
    environment:
      - MG_API_KEY
      - MG_DOMAIN
      - "https_proxy=http://x:${PROXY_PASS}@vaulty:8080"
    volumes:
      # demo app should have access to Vaulty's CA certificate
      # when we run command to add it to system certificates
      - "./vaulty/ca.cert:/app/ca.cert"

  vaulty:
    image: vaulty/vaulty
    command: ./vaulty proxy --debug -r /.vaulty/routes.json --ca /.vaulty
    ports:
      - "3000:8080"
    environment:
      - PROXY_PASS
      - ENCRYPTION_KEY
    links:
      - backend
    volumes:
      - "./vaulty:/.vaulty"
```

<div class='new-lines'>
  <div class='lines-bg'>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
    <div>+</div>
  </div>
</div>

Here's what changed:

* We now map port `:3000` to Vaulty (The backend is served at port `:8080` instead).
* We created a volume that allows our backend to access the root CA certificate generated by Vaulty.
* We run the Vaulty proxy in [debug mode](/reference/configuration/#debug-mode). Debug mode should **never** be used in production because it logs all incoming and outgoing requests.

Also, let's add the following Vaulty configuration parameters into .env file:

* `PROXY_PASS` - [password](/reference/configuration#proxy-password) for forward proxy
* `ENCRYPTION_KEY` - [key](/reference/configuration#encryption-key) to encrypt/decrypt data

Our `.env` file now looks like this:

```bash
# ./env
MG_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxx
MG_DOMAIN=mg.yourdomain.com
PROXY_PASS=12345678
ENCRYPTION_KEY=776f726420746f206120736563726574
```

### 1. Pseudonymize incoming emails

Start by creating a [`routes.json`](https://github.com/vaulty-co/demo-collect-emails/blob/master/vaulty/routes.json) that tokenizes the incoming email request (before it hits our backend):

```json
{
  "options": {
    "default_upstream": "http://backend:3000"
  },
  "routes": [
    {
      "name": "tokenize-incoming-email",
      "method": "POST",
      "url": "/subscribe",
      "request_transformations": [
        {
          "type": "form",
          "fields": "email",
          "action": {
            "type": "tokenize",
            "format": "email"
          }
        }
      ]
    },

    /* pass-thru all other routes as-is */
    {
      "name": "in-all",
      "method": "*",
      "url": "/*"
    }
  ]
}
```

Restart vaulty to load the new routes:

```shell
docker-compose --file docker-compose-vaulty.yml restart vaulty
```

If you try subscribing now, you'll get an error response with an "Invalid email" message. That's because Mailgun can't send emails to tokenized emails (they end with a `.local`):

![result](/img/cookbooks/in-mg-error.png)

✅ Step 1 complete! Vaulty is successfully intercepting our requests, pseudonymizing the email and passing it to our backend.

### 2. Detokenize outgoing requests

Mailgun will need to receive the email in plain text so we have to detokenize it on the way out.

In order to do so, the Mailgun library has to connect to the Mailgun API via Vaulty (which serves as a Forward Proxy). This can easily be accomplished without any code changes, by setting the `http_proxy` environment variable.

We already set it to `http://x:${PROXY_PASS}@vaulty:8080` earlier.
(`PROXY_PASS` is used for [proxy authentication](/reference/forward-proxy#proxy-authentication)).

**1. Add the Vaulty CA Certificate to our backend**

Since Vaulty uses HTTPS, we'd also need the Mailgun HTTP client to verify [TLS certificates generated by Vaulty](/reference/forward-proxy#transformation-of-tls-encrypted-data). That means we'd need to add Vaulty's CA certificate into the backend container's CA certificates directory:

```shell
docker-compose --file docker-compose-vaulty.yml exec backend sh
cp ./vaulty/ca.cert /usr/local/share/ca-certificates/vaulty.crt && update-ca-certificates
```

Now, just restart the backend service:

```shell
docker-compose --file docker-compose-vaulty.yml restart backend
```

**2. Update `routes.json`**

Now, let's update our `routes.json` to detokenize the email address on it's way to the Mailgun API:

```json
// ./routes.json
{
  "routes":[
    ...
    {
      "name":"detokenize-outgoing-email",
      "method":"POST",
      "url":"https://api.mailgun.net/v3/mg.vaulty.co/messages",
      "request_transformations":[
        {
          "type":"form",
          "fields":"to",
          "action":{
            "type":"detokenize"
          }
        }
      ]
    }
  ]
}
```

This route uses form transformation to detokenize the `to` field (which contains the email address). Finally, just restart Vaulty to reload routes:

```
docker-compose --file docker-compose-vaulty.yml restart vaulty
```

Now, when you try to subscribe again:

![result](/img/cookbooks/success.png)

Email was successfully sent to the recipient 🎉

## Summary

We've achieved everything we set out to do:

1. Pseudonymize all emails in our database (replace them with tokens)
2. Encrypt and store the emails in isolated storage (managed by Vaulty)
3. Prevent application developers from accessing plain emails.

And all this **with zero changes to our application code!**.

Hooray, Vaulty!