
var express = require('express');
var zombie = require('zombie');
var http = require('http');

var oauthFlow = require('../index.js');

var expect = require('chai').expect;


describe('oauth flow', function() {
    var app, browser, server;

    before(function(done) {
        app = express();
        var MemoryStore = express.session.MemoryStore;
        app.configure(function () {
            app.use(express.cookieParser());
            app.use(express.session({
                store: new MemoryStore(),
                secret: 'secret',
                key: 'connect.sid'
            }));
        });
        server = http.createServer(app);
        server.listen(3000, done);
    });


    it('should work for oauth 1.0 on dropbox', function(done) {

       var flow = oauthFlow({
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
        });
        app.use('/auth/dropbox', flow);
        app.use('/auth/dropbox', function (req, res) {
            console.log("Called dropbox after flow");
            expect(req.query).to.have.property('test');
            expect(req.query).to.have.property('other');
            expect(req.oauth).to.have.property('oauth_access_token_secret');
            expect(req.oauth).to.have.property('oauth_access_token');
            res.end('done');
            done();
        });


        var browser = new zombie({
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.63 Safari/537.31'
        });
        //browser.visit("http://localhost:3000/auth/dropbox/start?test=blah&other=test")
        browser.visit("http://localhost:3000/auth/dropbox?test=blah&other=test")
        .then(function () {
            //console.log("redirected, filling data");
            // Fill email, password and submit form
            return browser.
                fill("login_email",        "m8r-sphnmi@mailinator.com").
                fill("login_password",     "test123").
                pressButton("Sign in");

        }).then(function() {
            //console.log("allowing the use");
            return browser.
                pressButton('Allow');
        }).then(function() {
            //console.log("redirected back");

        }, function(err) {
            throw err;
        });

    });
    it('should work for oauth 2.0 on box', function(done) {
        //return done();
        var flow = oauthFlow({
            provider: {
                authorizationUrl: "https://www.box.com/api/oauth2/authorize",
                accessTokenUrl: "https://www.box.com/api/oauth2/token",
                version: "2.0"
            },
            user: {
                clientId: "jh439ip7nipzmrzatsaxgqlx6ckri7fv",
                clientSecret: "VB9LURI0dSzilO63Wpl6xJzQfrY8DOu8"
            }
        }, function (req, res) {
            expect(req.query).to.have.property('test');
            expect(req.query).to.have.property('other');
            expect(req.oauth).to.have.property('oauth_access_token');
            expect(req.oauth).to.have.property('oauth_refresh_token');
            res.end('done');
            done();
        });

        app.use('/auth/box', flow);

        var browser = new zombie({
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.63 Safari/537.31',
            debug: true
        });
        browser.visit("http://localhost:3000/auth/box?test=blah&other=test")
        //browser.visit("http://localhost:3000/auth/box/start?test=blah&other=test")
            .then(function () {
                console.log("Redirected, filling up text");
                // Fill email, password and submit form
                return browser.
                    fill("login",        "m8r-sphnmi@mailinator.com").
                    fill("password",     "test123").
                    pressButton("Log In");
            }).then(function() {
                console.log("Logged in, trying to alllow app");
                return browser.
                    pressButton('Allow');
            }).then(function() {
                console.log("Done, redirecting back");
            }, function(err) {
                throw err;
            });

    });
    it('should work for oauth 2.0 on linkedin', function(done) {
        //return done();
        var flow = oauthFlow({
            provider: {
                authorizationUrl: function (oauth) {
                    return "https://www.linkedin.com/uas/oauth2/authorization?client_id=" + oauth.clientId +
                        "&redirect_uri=" + oauth.oauth_callback +
                        "&state=DCEEFFF45453sdffef424" +
                        "&response_type=code";
                },
                accessTokenUrl: "https://www.linkedin.com/uas/oauth2/accessToken",
                version: "2.0"
            },
            user: {
                clientId: "b778bq6xnrzm",
                clientSecret: "oG3pFhfMUfRLpbiX"
            }
        }, function (req, res) {
            expect(req.query).to.have.property('test');
            expect(req.query).to.have.property('other');
            expect(req.oauth).to.have.property('oauth_access_token');
            expect(req.oauth).to.have.property('oauth_refresh_token');
            res.end('done');
            done();
        });

        app.use('/auth/linkedin', flow);

        var browser = new zombie({
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.63 Safari/537.31',
            debug: true
        });
        browser.visit("http://localhost:3000/auth/linkedin?test=blah&other=test")
            //browser.visit("http://localhost:3000/auth/box/start?test=blah&other=test")
            .then(function () {
                console.log("Redirected, filling up text");
                // Fill email, password and submit form
                return browser.
                    fill("session_key",        "m8r-sphnmi@mailinator.com").
                    fill("session_password",   "test123").
                    pressButton("Allow access");
            }).then(function() {
                console.log("Done, redirecting back");
            }, function(err) {
                throw err;
            });

    });
    after(function(done) {
        server.close(done);
    });
});
