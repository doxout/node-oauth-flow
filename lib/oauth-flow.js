var app = require('flask-router-plus')(),
    OAuth = require('oauth').OAuth;

// options = {
//  requestTokenUrl,
//  authorizationUrl,
//  accessTokenUrl,
//  appKey,
//  appSecret,
//  callback
// }

module.exports = function (options, finalWare) {
    function oAuthAccessToken(req, res, next) {
        var oa = new OAuth(options.accessTokenUrl, options.accessTokenUrl, options.appKey, options.appSecret, options.version, options.callbackUrl, options.type);
        req.oauth = req.session.oauth;
        oa.getOAuthAccessToken(req.query.oauth_token, req.oauth.oauth_token_secret, function (error, oauth_access_token, oauth_access_token_secret) {
            console.log('ERROR:', error);
            req.oauth.oauth_access_token = oauth_access_token;
            req.oauth.oauth_access_token_secret = oauth_access_token_secret;
            next();
        });
    }

    app.get('/start', function (req, res) {
        var oa = new OAuth(options.requestTokenUrl, options.requestTokenUrl, options.appKey, options.appSecret, options.version, options.callbackUrl, options.type);
        oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret) {
            req.session.oauth = {
                oauth_token: oauth_token,
                oauth_token_secret: oauth_token_secret
            };
            res.redirect(
                options.authorizationUrl + "?oauth_token=" + oauth_token +
                    "&oauth_token_secret=" + oauth_token_secret +
                    "&oauth_callback=" + options.callbackUrl
            );
        });
    });

    app.get('/end', oAuthAccessToken, finalWare);

    return app.route;
};