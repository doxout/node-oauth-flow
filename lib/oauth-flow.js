module.exports = function (options, finalWare) {
    var app = require('flask-router-plus')(),
        OAuth = require('oauth').OAuth,
        OAuth2 = require('oauth').OAuth2;

    function createCallbackUrl(req) {
        req.usePath = req.originalUrl.substr(0, req.originalUrl.length - req.url.length);

        var queryString = Object.keys(req.query).map(function(key) { 
            return [key, req.query[key]].join('=')
        }).join('&');
        queryString = queryString.length ? '?' + queryString : '';
        return req.protocol + '://' + req.header('host') + req.usePath + '/end' + queryString;
    }

    function oauthStart(req, res) {
        var callbackUrl = createCallbackUrl(req);
        var oa = new OAuth(
            options.provider.requestTokenUrl,
            options.provider.requestTokenUrl,
            options.user.appKey,
            options.user.appSecret,
            options.provider.version,
            callbackUrl,
            options.provider.type
        );
        oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret) {
            req.session.oauth = {
                oauth_token: oauth_token,
                oauth_token_secret: oauth_token_secret,
                oauth_callback: callbackUrl
            };
            var authorizationUrl = typeof(options.provider.authorizationUrl) == 'function' ?
                options.provider.authorizationUrl(req.session.oauth) :
                options.provider.authorizationUrl + "?oauth_token=" + oauth_token +
                    "&oauth_token_secret=" + oauth_token_secret +
                    "&oauth_callback=" + encodeURIComponent(callbackUrl);

            res.writeHead(302, { 'Location': authorizationUrl });
            res.end();
        });
    };

    function oauthEnd(req, res, next) {
        var oa = new OAuth(
            options.provider.accessTokenUrl,
            options.provider.accessTokenUrl,
            options.user.appKey,
            options.user.appSecret,
            options.provider.version,
            req.session.oauth.oauth_callback,
            options.provider.type
        );

        req.oauth = req.session.oauth;

        oa.getOAuthAccessToken(req.query.oauth_token, req.oauth.oauth_token_secret,
            function (error, oauth_access_token, oauth_access_token_secret) {
                req.oauth.oauth_access_token = oauth_access_token;
                req.oauth.oauth_access_token_secret = oauth_access_token_secret;
                next();
            });
    }

    function oauth2Start(req, res) {
        var callbackUrl = createCallbackUrl(req);
        var oa = new OAuth2(
            options.user.clientId,
            options.user.clientSecret,
            "",
            options.provider.authorizationUrl,
            options.provider.accessTokenUrl
        );
        var authorizationUrl = typeof(options.provider.authorizationUrl) == 'function' ?
            options.provider.authorizationUrl({
                clientId: options.user.clientId,
                redirect_uri: callbackUrl
            }) :
            oa.getAuthorizeUrl({
                response_type: 'code',
                redirect_uri: callbackUrl
            });

        res.writeHead(302, { 'Location': authorizationUrl });
        res.end();
    }

    function oauth2End(req, res, next) {
        var oa = new OAuth2(
            options.user.clientId,
            options.user.clientSecret,
            "",
            options.provider.authorizationUrl,
            options.provider.accessTokenUrl
        );

        oa.getOAuthAccessToken(req.query.code, {
                grant_type: 'authorization_code'
            },
            function (error, oauth_access_token, oauth_refresh_token) {
                req.oauth = {
                    oauth_access_token: oauth_access_token,
                    oauth_refresh_token: oauth_refresh_token
                };
                next();
            });
    }

    var start = options.provider.version == "1.0" ? oauthStart : oauth2Start;
    var end = options.provider.version == "1.0" ? oauthEnd : oauth2End;

    app.get('/start', start);
    app.get('/end', end, finalWare);

    return app.route;
};
