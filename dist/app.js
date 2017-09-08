"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const middlewares = require("./middlewares");
const authentication_1 = require("./authentication");
const db = require("./db");
var http = require('http');
var path = require('path');
var app = express();
/**
 * TODO:
 *  auth: Get username/password, authenticate, then use authentication middleware for all other entry points
 *        Set up HTTPS (w/certificate)
 *  verbs:
 *  socketio:
 *  Angular: Store and send the token with each request (do it in the dbService?) and implement canActivate in routes.
 */
app.use('', middlewares.setHeaders);
app.all('/login', authentication_1.auth.login);
/**
 * Non authenticated services for available username/email in signup screen
 */
app.get('/api/v1/userAvailable', db.userAvailable);
// app.use('/api/v1/secure/*', [require('./middlewares/validateRequest')]);
app.all('*', function (req, res) {
    const response = { message: 'working!' };
    res.json(JSON.stringify(response));
});
/* Start the Server */
app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
//# sourceMappingURL=app.js.map