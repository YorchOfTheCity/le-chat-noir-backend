import * as jwt from 'jwt-simple';
import { Request, Response } from 'express';
import { User, UserDocument } from './schemas/user';
import * as db from './db';

const TOKEN_SECRET = 'tL7CM579pL0WD8^9%v9)7O&b>ge-jY78-j953yl$D06796k6'
const TOKEN_EXPIRATION_DAYS = 30;
const MILLIS_IN_DAY = 1000*60*60*24;

export var auth = {
  
  login(req: Request, res: Response) {
    
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
  validToken (req: Request, res: Response, next: Function) {
    console.log('debugging');
    const json = JSON.parse(req.query.body);
    const token = json.token;
    const user: User = json.user;

    let decoded;

    try {
      decoded = jwt.decode(token, TOKEN_SECRET);
    }catch(e) {
      // Token is invalid, can't be decoded;
      // "Error: Signature verification failed"
      res.status(401);
      res.json({
        'status': 401,
        'message': 'Invalid token'
      });
    }
    
    if(user.name === decoded.user.name && user.email === decoded.user.email){
      if(decoded.expires > new Date().getTime()){
        // Valid, fill un with the user info and let him through:
        next();
      }else {
        // expired
        res.status(401);
        res.json({
          'status': 401,
          'message': 'Session expired'
        });
      }
    }else {
      // invalid token
      res.status(401);
      res.json({
        'status': 401,
        'message': 'Invalid credentials'
      });
    }
  },

  getUser(req: Request): User{
    const json = JSON.parse(req.query.body);
    return json.user;
  },

  genToken
}

function genToken(user: User) {
  var expires = expiresIn(TOKEN_EXPIRATION_DAYS);
  var token = jwt.encode({
    expires: expires,
    user: user
  }, TOKEN_SECRET);
  return {
    // TODO: return email and username in plain text for frontend to consume
    token: token,
    expires: expires,
    user: user
  };
}

function expiresIn(numDays: number): number {
  var dateObj = new Date();
  return dateObj.getTime() + (TOKEN_EXPIRATION_DAYS * MILLIS_IN_DAY);
}