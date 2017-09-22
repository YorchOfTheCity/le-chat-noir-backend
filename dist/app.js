"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const socketIO = require("socket.io");
const middlewares = require("./middlewares");
const authentication_1 = require("./authentication");
const db = require("./db");
const socketsComm_1 = require("./socketsComm");
var path = require('path');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');
var httpServer = http.createServer(app);
var io = socketIO(httpServer);
let user;
io.on('connection', socketsComm_1.ioMain);
/**
 * Standard middewares
 */
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
/**
 * TODO:
 *  auth: Get username/password, authenticate, then use authentication middleware for all other entry points
 *        Set up HTTPS (w/certificate)
 *  verbs:
 *  socketio:
 *  Angular: Store and send the token with each request (do it in the dbService?) and implement canActivate in routes.
 */
app.use('', middlewares.setHeaders);
app.get('/api/v1/login', authentication_1.auth.login);
app.post('/api/v1/user', db.insertUser);
/**
 * Non authenticated services for available username/email in signup screen
 */
app.get('/api/v1/userAvailable', db.userAvailable);
app.get('/api/v1/emailAvailable', db.emailAvailable);
// Service for signup
// app.post('/api/v1/userAvailable')
/**
 * Authentication middleware
 */
app.use('/api/v1/secure/*', authentication_1.auth.validToken);
app.get('/api/v1/secure/contacts', db.getContacts);
app.get('/api/v1/secure/invites', db.getInvitesHttp);
// app.post('/api/v1/secure/contacts/:contact', db.addContact);
app.post('/api/v1/secure/contacts/invite/:contact', db.inviteContact);
app.all('*', function (req, res) {
    const response = { message: 'working!' };
    res.json(JSON.stringify(response));
});
/* Start the Server */
app.set('port', process.env.PORT || 3000);
httpServer.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
//# sourceMappingURL=app.js.map