
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
        }, function (req, res) {
            expect(req.query).to.have.property('test');
            expect(req.query).to.have.property('other');
            expect(req.oauth).to.have.property('oauth_access_token_secret');
            expect(req.oauth).to.have.property('oauth_access_token');
            res.end('done');
            done();
        });

        app.use('/auth/dropbox', flow);
       
        var browser = new zombie({
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.63 Safari/537.31'
        });        
        browser.visit("http://localhost:3000/auth/dropbox/start?test=blah&other=test")
        .then(function () {
            // Fill email, password and submit form
            return browser.
                fill("login_email",        "m8r-sphnmi@mailinator.com").
                fill("login_password",     "test123").
                pressButton("Sign in");

        }).then(function() {
            return browser.
                pressButton('Allow');
        }).then(function() {
        
        }, function(err) {
            throw err;
        }); 

    });
    after(function(done) {
        server.close(done);
    });

});
