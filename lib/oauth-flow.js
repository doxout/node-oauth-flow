module.exports = function (options, finalWare) {

    finalWare = finalWare || function(req, res, next) { next(); }

    var OAuth = require('oauth').OAuth;
    var OAuth2 = require('oauth').OAuth2;

    function createCallbackUrl(req) {
        var redirectUrl = req.protocol + '://' + req.header('host')
            + req.originalUrl;
        return redirectUrl;
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
                options.provider.authorizationUrl(req.session.oauth, callbackUrl) :
                options.provider.authorizationUrl + "?oauth_token=" + oauth_token +
                    "&oauth_token_secret=" + oauth_token_secret +
                    "&oauth_callback=" + encodeURIComponent(callbackUrl);

            res.writeHead(302, { 'Location': authorizationUrl });
            res.end();
        });
    }

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

        req.session.oauth = {
            oauth_callback: callbackUrl
        };

        var authorizationUrl = typeof(options.provider.authorizationUrl) == 'function' ?
            options.provider.authorizationUrl({
                clientId: options.user.clientId,
                oauth_callback: callbackUrl
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
                'grant_type': 'authorization_code',
                'redirect_uri': req.session.oauth.oauth_callback
            },
            function (error, oauthAccessToken, oauthRefreshToken) {
                req.oauth = {
                    'oauth_access_token': oauthAccessToken,
                    'oauth_refresh_token': oauthRefreshToken
                };
                next();
            });
    }

    var version = options.provider.version == "1.0" ? 1 : 2;

    var start = version == 1 ? oauthStart : oauth2Start;
    var end = version == 1 ? oauthEnd : oauth2End;

    return function (req, res, next) {
        if ((req.query['oauth_token'] && version == 1)
            || (req.query['code'] && version == 2)) {
            end(req, res, finalWare.bind(this, req, res, next));
        } else {
            start(req, res);
        }
    };

};
