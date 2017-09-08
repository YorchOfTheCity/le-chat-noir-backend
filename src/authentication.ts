import * as jwt from 'jwt-simple';
import { Request, Response } from 'express';
import { User, UserDocument } from './schemas/user';
import * as db from './db';

const TOKEN_SECRET = 'tL7CM579pL0WD8^9%v9)7O&b>ge-jY78-j953yl$D06796k6'
const TOKEN_EXPIRATION = 30; // days


export var auth = {
  
  login: function (req: Request, res: Response) {
    
    var username: string = req.query.username.toLowerCase() || '';
    var password: string = req.query.password || '';

    if (username === '' || password === '') {
      res.status(401);
      res.json({
        'status': 401,
        'message': 'Invalid credentials'
      });
      return;
    }

    // TODO: Fire a query to your DB and check if the credentials are valid
    db.getUser(username, password).then(
      (userDoc: UserDocument) => {

        if (!userDoc) { // If authentication fails, we send a 401 back
          res.status(401);
          res.json({
            'status': 401,
            'message': 'Invalid credentials'
          });
          return;
        }
        if (userDoc) {
          // If authentication is success, we will generate a token
          // and dispatch it to the client
          res.json(genToken(new User(userDoc.name, userDoc.email, null)));
        }

      },
      (rejectedReason: string) => {
        res.status(401);
        res.json({
          'status': 401,
          'message': 'Invalid credentials'
        });
      }
    );
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