---
id: email-list-with-protected-emails
title: An email list without emails
---

![demo-front](/img/cookbooks/demo-front.png)

In this cookbook, we'll see how Vaulty can help you to protect user's data and how you can control and limit its usage to minimize the potential damage in the event of a data breach.

For this cookbook, we will use a demo app that collects user emails and sends subscription confirmation to the user.

The goal of the guide is to show how by adding Vaulty to the demo app we can achieve the following results:

1. all emails in DB are pseudonymized (replaced with tokens)
2. original emails are encrypted and stored in isolated storage
3. application developers have no access to plain emails and can send emails using pseudonymized data

## Demo App

The source code of the demo app can be found here: https://github.com/vaulty-co/demo-collect-emails. The demo application is simplified to keep only what matters for the demo.

The architecture of the demo application:

<p class="text--center"><img src="/img/cookbooks/demo-app-arch.svg" height="480"/></p>

Steps of the demo application:
1. A user submits his email from web browser to a backend
2. The backend saves email in DB
3. The backend sends a confirmation email to the user via email service (e.g., [Mailgun](https://www.mailgun.com/) or [Sendgrid](https://sendgrid.com/))

### Front-end

Let's look at the source code of the app. It has a pretty [simple form](https://github.com/vaulty-co/demo-collect-emails/blob/master/static/index.html) collecting emails with input field named `email`. The form will be submitted to `/subscribe`:

```html
<form action="/subscribe" method="post">
        ...
	<input type="email" name="email" class="form-control u-full-width" placeholder="Enter your email" required>
	<input type="submit" class="btn u-full-width" value="Subscribe">
        ...
</form>	
```

### Back-end

 Our [backend](https://github.com/vaulty-co/demo-collect-emails/blob/master/main.go) has two endpoints:

- /subscribe - saves email in a database and sends confirmation email via Mailgun
- /subscribers - shows the list of emails from a database

Here is the code with application logic:

```go
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

Function `sendConfirmationEmail` uses [Go library](https://github.com/mailgun/mailgun-go/) for sending mail with the Mailgun API:

```go
func sendConfirmationEmail(to string) error {
	// create Mailgun client using env variables (MG_API_KEY, MG_DOMAIN)
	mg, err := mailgun.NewMailgunFromEnv()
	if err != nil {
		return err
	}

	// create message with recipient "to"
	m := mg.NewMessage("Owner <pavel+demo@vaulty.co>", "Confirmation Email", "Hey! Your subscription is confirmed!", to)

	// set timeout to 30 seconds
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()

	// send message
	_, _, err = mg.Send(ctx, m)
	return err
}
```

### Run the app

For this demo, we will use Docker, Docker Compose. We also need the API key of the active Mailgun account. First, let's create `.env` file with environment variables:

```bash
MG_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxx
MG_DOMAIN=mg.yourdomain.com
```

* `MG_DOMAIN` - Your Mailgun domain
* `MG_API_KEY` - Mailgun [API Key](https://help.mailgun.com/hc/en-us/articles/203380100-Where-Can-I-Find-My-API-Key-and-SMTP-Credentials-)

To run the demo application you need to put these commands into your shell:

```shell
git clone git@github.com:vaulty-co/demo-collect-emails.git
cd demo-collect-emails
docker-compose up
```

From docker-compose.yml you may see that we have only backend service:

```yml
version: '2.0'
services:
  backend:
    build: .
    command: ./main -port 3000
    environment:
      - MG_API_KEY
      - MG_DOMAIN
    ports:
      - "3000:3000"
```

If you navigate your browser to http://127.0.0.1:3000 you will see the subscription form of our application. 

Here are the screenshots from the working application:

![result](/img/cookbooks/result.png)

The last screen shows the list of subscribers with plain emails that are stored in the database. It's time to protect user's data! Let's add Vaulty to the demo app.

## Adding Vaulty

Vaulty will be used for the following:

* pseudonymize (tokenize and encrypt) incoming data (subscriber's email) and pass it to the backend
* de-tokenize emails when demo application sends it to the mail service (Mailgun)

Let's change out infrastructure by adding Vaulty and by routing incoming and outgoing requests from the demo app to Vaulty.  This is how changed architecture looks like:

![result](/img/cookbooks/arch.svg)

To implement this change we copy existing Compose file into `docker-compose-vaulty.yml` and add vaulty service:

```yaml
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

As you see in this Compose file we:

* link vaulty service with the backend and now port 3000 on the host machine is mapped to Vaulty's port 8080 not to the backend's port.
* configure Vaulty via environment variables: set proxy password and encryption key.
* create volumes for backend and vaulty for the same demo app directory. Vaulty will generate the root CA certificate and the key in this directory and the backend will use the CA certificate for HTTP client.
* we run Vaulty proxy in [debug mode](/docs/reference/configuration/#debug-mode), it should not be used for production

Also, let's add the following Vaulty configuration parameters into .env file:

* `PROXY_PASS` - [password](/docs/reference/configuration#proxy-password) for forward proxy
* `ENCRYPTION_KEY` - [key](/docs/reference/configuration#encryption-key) to encrypt/decrypt data

Our `.env` file:

```bash
MG_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxx
MG_DOMAIN=mg.yourdomain.com
PROXY_PASS=12345678
ENCRYPTION_KEY=776f726420746f206120736563726574
```

### Pseudonymization/tokenization

For the beginning, create routes.json ([file with routes](https://github.com/vaulty-co/demo-collect-emails/blob/master/vaulty/routes.json)) for Vaulty to accept all inbound requests and forward them to our backend:

```json
{
  "options":{
    "default_upstream":"http://backend:3001"
  },
  "routes":[
    {
      "name":"in-all",
      "method":"*",
      "url":"/*"
    }
  ]
}
```

Now, let's run the backend and Vaulty using newly created Compose file:

```shell
docker-compose --file docker-compose-vaulty.yml up
```

Here is the output:

```
...
vaulty_1   | ==> Vaulty proxy server started on :8080!
```

When you navigate the browser to http://127.0.0.1:3000 (host machine 3000 port is mapped to vaulty's 8080 port) you see subscription form as it was without Vaulty. This because Vaulty forwards all requests to the backend. Console shows debug information that we will need in a bit. Let's subscribe for the newsletter in the browser:

![result](/img/cookbooks/subscribe-success.png)

And let's look at what we see in the console. We should pay attention to "Request Dump":

![result](/img/cookbooks/in-form.png)

We see the dump of the POST request that goes to /subscribe with application/x-www-form-urlencoded content type and body. Now we are ready to create a route that tokenizes submitted email:

```json
{
  "options":{
    "default_upstream":"http://backend:3001"
  },
  "routes":[
    {
      "name":"in-tokenize-email",
      "method":"POST",
      "url":"/subscribe",
      "request_transformations":[
        {
          "type":"form",
          "fields":"email",
          "action":{
            "type":"tokenize",
            "format":"email"
          }
        }
      ]
    },
    {
      "name":"in-all",
      "method":"*",
      "url":"/*"
    }
  ]
}
```

Restart vaulty service to load new routes:

```
docker-compose --file docker-compose-vaulty.yml restart vaulty
```

Let's try to subscribe again. This time we get an error:

![result](/img/cookbooks/error.png)

in the console we see "invalid email" error because tokenized email with .local domain was not accepted by Mailgun:

![result](/img/cookbooks/in-mg-error.png)

Let's check what we have in our DB:

![result](/img/cookbooks/tokenized-subscribers.png)

As you can see, our DB stores a tokenized email. The first part with email tokenization is completed:

* the backend does not store plain emails and has no direct access to them
* plain emails are encrypted and securely stored by Vaulty

We achieved this just by redirecting traffic to Vaulty instead of backend. With **zero code changes** inside the application!

**The main question is:** how to send subscription confirmation having tokenized email?

### De-tokenization

Vaulty works as a forward proxy and it can transform requests/responses. It means that to detokenize emails Mailgun library has to connect to the Mailgun API via Vaulty (forward proxy). **This can be achieved without any code changes** by setting the `http_proxy` environment variable. Let's set it in  `docker-compose-vaulty.yml` to the following value: [http://x:${PROXY_PASS}@vaulty:8080"](http://x:${PROXY_PASS}@vaulty:8080"). `PROXY_PASS` is used for [proxy authentication](/docs/reference/forward-proxy#proxy-authentication) (its value is taken from `.env` file by Compose).

To let Mailgun http client verify [TLS certificates generated by Vaulty](/docs/reference/forward-proxy#transformation-of-tls-encrypted-data) for requested domain, we need to add Vaulty's CA certificate into backend container system CA certificates. To accomplish this get into backend container:

```shell
docker-compose --file docker-compose-vaulty.yml exec backend sh
```

 inside the container add Vaulty's root CA certificate to system CA certificates:

```shell
cp ./vaulty/ca.cert /usr/local/share/ca-certificates/vaulty.crt && update-ca-certificates
```

finally, restart the backend service:

```shell
docker-compose --file docker-compose-vaulty.yml restart backend
```

After its done, navigate to http://127.0.0.1:3000 and subscribe. In the console you will see that there is no route for outbound connections and the backed failed to send an email:

![result](/img/cookbooks/backend-proxy-error.png)

We need to figure out two things now:

1. What is the destination URL to which Mailgun library makes requests?
2. What exactly it sends (content type and body) to API?

First, from the screenshot above you can see the URL Mailgun library is making request to https://api.mailgun.net/v3/mg.vaulty.co/messages.

Second, let's find a dump of this request:

![result](/img/cookbooks/out-request-dump.png)

We see that content type is multipart/form-data and field "to" contains tokenized email. That's all we need to create an outbound route for this request:

```json
{
  "options":{
    "default_upstream":"http://backend:3001"
  },
  "routes":[
    ...
    {
      "name":"out-send-email",
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

This route uses form transformation to detokenize field "to". Let's restart Vaulty to reload routes:

```
docker-compose --file docker-compose-vaulty.yml restart vaulty
```

Now try to subscribe again:

![result](/img/cookbooks/success.png)

Email was successfully sent to the recipient (Vaulty detokenized recipient email in Mailgun request)!

## Summary

We have achieved the expected results of this cookbook:

1. all emails in the DB will be pseudonymized (replaced with tokens)
2. the backend has no access to plain emails
3. original emails are encrypted and stored in isolated storage (Vaulty)
4. application developers are able to send emails using pseudonymized data

**All this was achieved without application code changes. Only by routing traffic to Vaulty.**

Please, [submit questions and your feedback](https://github.com/vaulty-co/vaulty/issues)! We would be glad to help you with setting up Vaulty!

