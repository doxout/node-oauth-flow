var app = require('flask-router-plus')(),
    OAuth = require('oauth').OAuth;

module.exports = function (options, finalWare) {
    function createCallbackUrl(req) {
        return req.protocol + '://' + req.header('host') + req.usePath + '/end';
    }

    function oAuthAccessToken(req, res, next) {
        var callbackUrl = createCallbackUrl(req);
        var oa = new OAuth(
            options.provider.accessTokenUrl,
            options.provider.accessTokenUrl,
            options.user.appKey,
            options.user.appSecret,
            options.provider.version,
            callbackUrl,
            options.provider.type
        );

        req.oauth = req.session.oauth;

        oa.getOAuthAccessToken(req.query.oauth_token, req.oauth.oauth_token_secret, function (error, oauth_access_token, oauth_access_token_secret) {
            req.oauth.oauth_access_token = oauth_access_token;
            req.oauth.oauth_access_token_secret = oauth_access_token_secret;
            next();
        });
    }

    app.get('/start', function (req, res) {
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
                oauth_token_secret: oauth_token_secret
            };
            var authorizationUrl = typeof(options.provider.authorizationUrl) == 'function' ?
                options.provider.authorizationUrl(req.session.oauth) :
                options.provider.authorizationUrl + "?oauth_token=" + oauth_token +
                    "&oauth_token_secret=" + oauth_token_secret +
                    "&oauth_callback=" + callbackUrl;

            res.redirect(authorizationUrl);
        });
    });

    app.get('/end', oAuthAccessToken, finalWare);

    return app.route;
};