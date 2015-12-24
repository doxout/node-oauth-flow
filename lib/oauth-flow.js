var util = require('util');
var OAuth2 = require('oauth').OAuth2

util.inherits(OAuth2CA, OAuth2);
function OAuth2CA(options) {
    OAuth2.call(this, options.clientId,  options.clientSecret, options.baseSite,
                options.authorizationUrl, options.accessTokenUrl, options.customHeaders);
    this.options = options;
    //this.useAuthorizationHeaderforGET(true);
}

OAuth2CA.prototype._executeRequest  = function(http_library, options, post_body, callback) {
    options.rejectUnauthorized = this.options.rejectUnauthorized == null ?
        true : this.options.rejectUnauthorized;
    if (this.options.basicAuth) {
        options.auth = this.options.basicAuth;
    }
    OAuth2.prototype._executeRequest.call(
        this, http_library, options, post_body, callback)
}



module.exports = function (options, finalWare) {


    finalWare = finalWare || function(req, res, next) { next(); }

    var OAuth = require('oauth').OAuth;
    var OAuth2 = OAuth2CA;

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
        oa.getOAuthAccessToken(
            req.query.oauth_token,
            req.oauth.oauth_token_secret,
	    req.query.oauth_verifier,
            function (error, oauth_access_token, oauth_access_token_secret) {
                req.oauth.error = error;
                req.oauth.oauth_access_token = oauth_access_token;
                req.oauth.oauth_access_token_secret = oauth_access_token_secret;
                next();
            });
    }

    function mkOauth2() {
        var basicAuth = options.user.basicAuth ?
            options.user.clientId + ':' + options.user.clientSecret : null;
        var oa = new OAuth2({
            clientId: options.user.clientId,
            clientSecret: options.user.clientSecret,
            baseSite: '',
            authorizationUrl: options.provider.authorizationUrl,
            accessTokenUrl: options.provider.accessTokenUrl,
            rejectUnauthorized: !options.provider.selfSignedCertificate,
            basicAuth: basicAuth
        });
        return oa;
    }

    function oauth2Start(req, res) {
        var callbackUrl = createCallbackUrl(req);

        var oa =  mkOauth2();
        req.session.oauth = {
            oauth_callback: callbackUrl
        };

        var authorizeUri = { response_type: 'code' };
        authorizeUri.redirect_uri = callbackUrl;
        if (typeof (options.provider.params) === 'object') {
            Object.keys(options.provider.params).forEach(function(key) {
                authorizeUri[key] = options.provider.params[key];
            });
        }
        var authorizationUrl = typeof(options.provider.authorizationUrl) == 'function' ?
            options.provider.authorizationUrl({
                clientId: options.user.clientId,
                oauth_callback: callbackUrl
            }) :
            oa.getAuthorizeUrl(authorizeUri);

        res.writeHead(302, { 'Location': authorizationUrl });
        res.end();
    }

    function oauth2End(req, res, next) {
        var oa =  mkOauth2();
        oa.getOAuthAccessToken(req.query.code, {
            'grant_type': 'authorization_code',
            'redirect_uri': req.session.oauth.oauth_callback
        }, function (error, oauthAccessToken, oauthRefreshToken) {
            req.oauth = {
                error: error,
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
            || ((req.query['code'] || req.query['error']) && version == 2)) {
            end(req, res, finalWare.bind(this, req, res, next));
        } else {
            start(req, res);
        }
    };

};
