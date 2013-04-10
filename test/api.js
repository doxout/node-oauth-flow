exports.oauthFlowTest = oauthFlowTest;

var express = require('express');
var http = require('http');
var app = express();

var MemoryStore = express.session.MemoryStore;

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        store: new MemoryStore(),
        secret: 'secret',
        key: 'connect.sid'
    }));
});

function oauthFlowTest(t) {
    var oauthFlow = require('../index.js');

    t.expect(0);

    app.use('/auth/dropbox', oauthFlow({
        requestTokenUrl: "https://api.dropbox.com/1/oauth/request_token",
        authorizationUrl: "https://www.dropbox.com/1/oauth/authorize",
        accessTokenUrl: "https://api.dropbox.com/1/oauth/access_token",
        appKey: "pmp04j615brrckx",
        appSecret: "qjuo453q0z9ss6i",
        callbackUrl: "http://localhost:3000/auth/dropbox/end",
        version: "1.0",
        type: "PLAINTEXT"
    }, function (req, res, next) {
        console.log(req.oauth);
        t.done();
    }));
}

app.listen(3000);

//exports.middleware = function (finalWare) {
//    app.get('/start', function (req, res) {
//        var reqTokenUrl = "https://api.dropbox.com/1/oauth/request_token";
//        var oa = new OAuth(reqTokenUrl, reqTokenUrl, "pmp04j615brrckx", "qjuo453q0z9ss6i", "1.0", "http://localhost:3000/auth/end", "PLAINTEXT");
//
//        oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret) {
//            req.session.oauth = {
//                oauth_token: oauth_token,
//                oauth_token_secret: oauth_token_secret
//            };
//            res.redirect(
//                "https://www.dropbox.com/1/oauth/authorize?oauth_token=" + oauth_token +
//                    "&oauth_token_secret=" + oauth_token_secret +
//                    "&oauth_callback=http://localhost:3000/auth/end"
//            );
//        });
//    });
//
//    app.get('/end', oAuthAccessToken, finalWare, function (req, res) {
//        res.render("authSuccess");
//    });
//
//    function oAuthAccessToken(req, res, next) {
//        var accTokenUrl = "https://api.dropbox.com/1/oauth/access_token";
//        var oa = new OAuth(accTokenUrl, accTokenUrl, "pmp04j615brrckx", "qjuo453q0z9ss6i", "1.0", "http://localhost:3000/auth/end", "PLAINTEXT");
//
//        req.oauth = req.session.oauth;
//        oa.getOAuthAccessToken(req.query.oauth_token, req.oauth.oauth_token_secret, function (error, oauth_access_token, oauth_access_token_secret) {
//            req.oauth.oauth_access_token = oauth_access_token;
//            req.oauth.oauth_access_token_secret = oauth_access_token_secret;
//            next();
//        });
//    }
//};