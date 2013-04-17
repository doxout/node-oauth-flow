# node-oauth-flow

Middleware for express or connect that implements 
the authorization flow of oAuth. What you do with
the authorization data is up to you.

# example

Here is a working dropbox example

```js
var oauthFlow = require('oauth-flow');

app.use('/auth/dropbox', oauthFlow({
    provider: {
        requestTokenUrl: "https://api.dropbox.com/1/oauth/request_token",
        authorizationUrl: "https://www.dropbox.com/1/oauth/authorize",
        accessTokenUrl: "https://api.dropbox.com/1/oauth/access_token",
        version: "1.0",
        type: "PLAINTEXT"
    },
    user: {
        appKey: "APPKEY",
        appSecret: "APPSECRET"
    }
}, function (req, res) {
    // req.oauth contains oauth_token, oauth_token_secret, oauth_access_token,
    // and oauth_access_token_secret
    res.end('done');
}));
```

This middleware doesn't assume that you wish to use it for user authentication.
Instead, it only implements the oAuth authorization flow. What it does is
install 2 routes:

* `/auth/dropbox/start`
* `/auth/dropbox/end`

Point the user to /auth/dropbox/start when you want them to authorize to
the app. You can add custom parameters to the url.

After the user authorizes your app, he will be redirected to `/auth/dropbox/end`
There, oauth-flow will put the authorization parameters in req.oauth then
call your custom middleware. Custom parameters from `/auth/dropbox/start` will
also be passed.

What you do afterwards with the authorization data is entirely up to you.
You may create a new user, authenticate a user, add their account or do
something entirely different. You can redirect them to the original URL, or
alternaively if you opened the authorization dialog in a new window, simply
send a script to close the window.

# todo

* make it a regular single-URL middleware which can be installed on an app.router
* add oauth 2.0 support.


