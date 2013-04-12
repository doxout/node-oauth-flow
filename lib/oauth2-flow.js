var app = require('flask-router-plus')(),
    OAuth2 = require('oauth').OAuth2;

module.exports = function (options, finalWare) {
    function createCallbackUrl(req) {
        req.usePath = req.originalUrl.substr(0, req.originalUrl.length - req.url.length);
        return req.protocol + '://' + req.header('host') + req.usePath + '/end';
    }

    function start(req, res) {
        var callbackUrl = createCallbackUrl(req);
        var oa = new OAuth2(
            options.user.clientId,
            options.user.clientSecret,
            "",
            options.provider.authorizationUrl,
            options.provider.accessTokenUrl
        );
        var authorizationUrl = typeof(options.provider.authorizationUrl) == 'function' ?
            options.provider.authorizationUrl() :
            oa.getAuthorizeUrl({
                response_type: 'code',
                redirect_uri: callbackUrl
            });

        res.writeHead(302, { 'Location': authorizationUrl });
        res.end();
    };

    function end(req, res, next) {
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

    app.get('/start', start);
    app.get('/end', end, finalWare);

    return app.route;
};