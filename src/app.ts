import * as express from 'express';
import * as middlewares from './middlewares';

import { auth } from './authentication';
import * as db from './db';
import { User } from './schemas/user';

var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

let user: User;

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

app.get('/api/v1/login', auth.login);
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
app.use('/api/v1/secure/*', auth.validToken);

app.all('*', function(req, res) {
  const response = {message: 'working!'};
  res.json(JSON.stringify(response));
})

/* Start the Server */
app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});