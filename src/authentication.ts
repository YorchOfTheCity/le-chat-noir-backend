import * as jwt from 'jwt-simple';
import { Request, Response } from 'express';

import { User } from './db';

const TOKEN_SECRET = 'tL7CM579pL0WD8^9%v9)7O&b>ge-jY78-j953yl$D06796k6'
const TOKEN_EXPIRATION = 30; // days


export var auth = {
  login: function (req: Request, res: Response) {
    
    var username = req.query.username || '';
    var password = req.query.password || '';

    if (username === '' || password === '') {
      res.status(401);
      res.json({
        'status': 401,
        'message': 'Invalid credentials'
      });
      return;
    }

    // TODO: Fire a query to your DB and check if the credentials are valid
    var dbUserObj = auth.validate(username, password);
    if (!dbUserObj) { // If authentication fails, we send a 401 back
      res.status(401);
      res.json({
        'status': 401,
        'message': 'Invalid credentials'
      });
      return;
    }
    if (dbUserObj) {
      // If authentication is success, we will generate a token
      // and dispatch it to the client
      res.json(genToken(dbUserObj));
    }
  },

  validate: function (username: string, password: string): User {
    // spoofing the DB response for simplicity
    var dbUserObj = { // spoofing a userobject from the DB. 
      name: 'arvind',
      role: 'admin',
      username: 'arvind@myapp.com'
    };
    return dbUserObj;
  },
  validateUser: function (username: string) {
    // spoofing the DB response for simplicity
    var dbUserObj = { // spoofing a userobject from the DB. 
      name: 'arvind',
      role: 'admin',
      username: 'arvind@myapp.com'
    };
    return dbUserObj;
  },
}

// private method
function genToken(user: User) {
  var expires = expiresIn(TOKEN_EXPIRATION);
  var token = jwt.encode({
    expires: expires,
    user: user
  }, TOKEN_SECRET);
  return {
    // TODO: return email and username in plain text for Angular to consume
    token: token,
    expires: expires,
    user: user
  };
}

function expiresIn(numDays: number) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}