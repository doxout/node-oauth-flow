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
        provider: {
            requestTokenUrl: "https://api.dropbox.com/1/oauth/request_token",
            authorizationUrl: "https://www.dropbox.com/1/oauth/authorize",
            accessTokenUrl: "https://api.dropbox.com/1/oauth/access_token",
            version: "1.0",
            type: "PLAINTEXT"
        },
        user: {
            appKey: "pmp04j615brrckx",
            appSecret: "qjuo453q0z9ss6i"
        }
    }, function (req, res, next) {
        console.log(req.oauth);
        res.end('done');
        t.done();
    }));

    var oauth2Flow = require('../lib/oauth2-flow.js');

    app.use('/auth/box', oauth2Flow({
        provider: {
            authorizationUrl: "https://www.box.com/api/oauth2/authorize",
            accessTokenUrl: "https://www.box.com/api/oauth2/token",
            version: "2.0"
        },
        user: {
            clientId: "jh439ip7nipzmrzatsaxgqlx6ckri7fv",
            clientSecret: "VB9LURI0dSzilO63Wpl6xJzQfrY8DOu8"
        }
    }, function (req, res, next) {
        console.log(req.oauth);
    }));
}

app.listen(3000);