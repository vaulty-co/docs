---
id: secure-email
title: WIP Secure Email Usage
---

![demo-front](/img/cookbooks/demo-front.png)

In this cookbook we'll see how Vaulty can help you to protect user's data and how you can controll and limit its usage to minimize the potential damage in the event of a data breach.

The architecture of application that collects emails and sends newsletters may look like this one:

<p class="text--center"><img src="/img/cookbooks/demo-app-arch.svg" height="480"/></p>

with this steps:
1. User submits his email from web browser to your backend
2. Your backend saves email in DB
3. Your backend sends confirmation email to user via email service (e.g., [Mailgun](https://www.mailgun.com/) or [Sendgrid](https://sendgrid.com/))

Expected result of adding Vaulty to the demo app:

1. all emails in DB will be pseudonymized (replaced with tokens)
2. original emails will be encrypted and stored in isolated storage
3. application developers still will be able to send emails using pseudonymized data.

The source code of the demo app can be found here: https://github.com/vaulty-co/demo-collect-emails. The demo application is simplified to keep only what matters for the demo.

## Front-end

Let's look at the source code of the app. It has a pretty [simple form](https://github.com/vaulty-co/demo-collect-emails/blob/master/static/index.html) to collect emails with input field named `email` that will be submitted at `/subscribe`:

```html
<form action="/subscribe" method="post">
        ...
	<input type="email" name="email" class="form-control u-full-width" placeholder="Enter your email" required>
	<input type="submit" class="btn u-full-width" value="Subscribe">
        ...
</form>	
```

## Back-end

 Our [backend](https://github.com/vaulty-co/demo-collect-emails/blob/master/main.go) has two endpoints:

- /subscribe - saves email in the database and sends confirmation email
- /subscribers - shows list of emails from the database

Here is the code we should pay attention to:

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
	domain := "mg.vaulty.co"
	apiKey := os.Getenv("MKG_API_KEY")

	// configure Mailgun client
	mg := mailgun.NewMailgun(domain, apiKey)

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

## Run the app

For this demo we will use Docker, Docker Compose. We also need API key of active Mailgun account. To run the demo application you need to put this commands into your shell:

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
    ports:
      - "3000:3001"
    command: ./main -port 3001
```

If you navigate your browser to http://127.0.0.1:3001 you will see the subscription form of our application. 

Here are the screenshots from the working application:

![result](/img/cookbooks/result.png)

Last screen shows the list of subscribers with plain emails that are stored in the database. It's time to protect user's data! Let's add Vaulty to the demo app.

## Adding Vaulty

Vaulty will be used here for the following:

* pseudonymize (tokenize) incoming data (subscriber's email)
* de-tokenize emails when application sends it to mail service

## Pseudonymization/tokenization

First, we need to add Vaulty to our infrastructure. This is how our architecture will change:

![result](/img/cookbooks/arch.svg)

To implement this change we will create a copy of our docker-compose.yml file and add vaulty service there:

```yaml
version: '2.0'
services:y
  backend:
    build: .
    command: ./main -port 3001
    environment:
      - MG_API_KEY
    volumes:
      - "./vaulty/ca.cert:/app/ca.cert"

  vaulty:
    image: vaulty/vaulty
    ports:
      - "3001:8080"
    environment:
      PROXY_PASS: "12345"
      ENCRYPTION_KEY: "776f726420746f206120736563726574"
    links:
      - backend
    volumes:
      - "./vaulty:/.vaulty"

```

As you may see we link vaulty service with backend (our backend works on 3001 port by default), configure Vaulty via environment variables and mount volume where Vauly will generate CA certificate for our backend service.

For the beginning we create [file with routes](https://github.com/vaulty-co/demo-collect-emails/blob/master/vaulty/routes.json) that accepts all inbound request and forwards them to our backend:

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

Now, let's run all backend with Vaulty using new docker compose file:

```shell
docker-compose --file docker-compose-vaulty.yml up
```

Here is the output:

```
...
vaulty_1   | ==> Vaulty proxy server started on :8080!
```

When you navigate browser to http://127.0.0.1:3001 (remember that we mapped 3001 port on host machine to 8080 port in vaulty container) you will see subscription form as it was without Vaulty. But let's look at output in shell. It will show a lot of debug information. In a second we will need to get back to it. Let's subscribe for newsletter in browser:

![result](/img/cookbooks/subscribe-success.png)

And let's look at what we see in the console log. Pay attention to "Request Dump":

![result](/img/cookbooks/in-form.png)

You may see the dump of POST request that goes to /subscribe with application/x-www-form-urlencoded content type and body. Now we are ready to create route that will tokenize submitted email:

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

We have to stop and start docker compose. Let's try to subscribe again. This time we get an error:


![result](/img/cookbooks/error.png)

and in console we see that Mailgun tells us that we pass invalid email address:

![result](/img/cookbooks/in-mg-error.png)

Let's check what we have in our DB:

![result](/img/cookbooks/tokenized-subscribers.png)


As you can see email was tokenized. Vaulty has encrypted plain email and generated token in email format. Mailgun does not accept such emails for delivery because of ".local" top level domain.

First part with tokenization is completed. But how do we send subscription confiration to user having tokenized email?

## De-tokenization

Now, we need somehow to send email via Mailgun library having tokenized email on hands. Our backend sends requests to Mailgun. In order to detokenize emails we to configure backend so it will send requests to Mailgun via proxy (Vaulty).

Here is the updated version of  `sendConfirmationEmail` function that uses HTTP client configured to send requests via proxy (Vaulty):

```go
func sendConfirmationEmail(to string) error {
	domain := "mg.vaulty.co"
	apiKey := os.Getenv("MG_API_KEY")
	// configure Mailgun client
	mg := mailgun.NewMailgun(domain, apiKey)

	// create http client with using Vaulty as proxy
	httpClient, err := clientWithProxy()
	if err != nil {
		return err
	}

	// configure Mailgun to use client with proxy
	mg.SetClient(httpClient)

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

HTTP client should be configured to use Vaulty as proxy and use CA certificate to verify TLS certificates Vaulty generates to intercept requests:

```go
func clientWithProxy() (*http.Client, error) {
	// Get the SystemCertPool, continue with an empty pool on error
	rootCAs, _ := x509.SystemCertPool()
	if rootCAs == nil {
		rootCAs = x509.NewCertPool()
	}

	// Read in the cert file
	certs, err := ioutil.ReadFile("ca.cert")
	if err != nil {
		log.Fatalf("Failed to append ca.cert to RootCAs: %v", err)
		return nil, err
	}

	// Append our cert to the system pool
	if ok := rootCAs.AppendCertsFromPEM(certs); !ok {
		log.Fatalf("Failed to parse and add ca.cert to the pool of certificates")
	}

	// Trust the augmented cert pool in our client
	config := &tls.Config{
		RootCAs: rootCAs,
	}

	proxyPass := os.Getenv("PROXY_PASS")

	proxyURL, _ := url.Parse(fmt.Sprintf("http://x:%s@vaulty:8080", proxyPass))

	tr := &http.Transport{
		Proxy: func(req *http.Request) (*url.URL, error) {
			return proxyURL, nil
		},
		TLSClientConfig: config,
	}

	client := &http.Client{Transport: tr}
	return client, nil
}
```

When we do this and try to subscribe we will see that there is no route for outbound connections and backed failed to send email:

![result](/img/cookbooks/backend-proxy-error.png)

We need to things:

1. To know where does Mailgun library make request (URL)
2. What exactly it sends (content type and body)

First, from the screenshot above you can see the URL Mailgun library is trying to make request at is https://api.mailgun.net/v3/mg.vaulty.co/messages.

Second, in console output let's find dump of this request:

![result](/img/cookbooks/out-request-dump.png)

We see that content type is multipart/form-data and field "to" contains tokenized email. That's all we need to create outbound route for this request:

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

This route uses form transformation to detokenize field "to". Let's stop and start docker compose and try to subscribe again:

![result](/img/cookbooks/success.png)

Email was successfully sent to the recipient!



