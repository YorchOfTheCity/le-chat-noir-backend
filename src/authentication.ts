import * as jwt from 'jwt-simple';
import { Request, Response } from 'express';
import { User, UserDocument } from './schemas/user';
import * as db from './db';

const TOKEN_SECRET = 'tL7CM579pL0WD8^9%v9)7O&b>ge-jY78-j953yl$D06796k6'
const TOKEN_EXPIRATION_DAYS = 30;
const MILLIS_IN_DAY = 1000 * 60 * 60 * 24;

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
          res.json(genToken(new User(userDoc.name, userDoc.email, null, null)));
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
  validToken(req: Request, res: Response, next: Function) {
    let json = req.headers['x-access-token'] as string;

    const jsonObject = JSON.parse(json);

    const token = jsonObject.token;
    const user: User = jsonObject.user;

    const validation = checkToken(token, user);

    if (validation.expired) {
      res.status(401);
      return res.json({
        'status': 401,
        'message': 'Session expired'
      });
    } else if (validation.invalid) {
      res.status(401);
      res.json({
        'status': 401,
        'message': 'Invalid credentials'
      });
    } else if (validation.valid) {
      db.getUserInner( user.name ).then(
        (dbUser) => {
          (req as any).user = dbUser;
          return next();
        }
      );
    } else {
      // validation.error
      // Token is invalid, can't be decoded;
      // "Error: Signature verification failed"
      res.status(401);
      return res.json({
        'status': 401,
        'message': 'Invalid token'
      });
    }
  },

  getUser(req: Request): User {
    const json = JSON.parse(req.query.body);
    return json.user;
  },

  tokenValidSocket( {token, user}: {token: string, user: User} ) {
    return checkToken(token, user);
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


function checkToken(token: any, user: User): { error?: boolean, valid?: boolean, expired?: boolean, invalid?: boolean } {
  let decoded;

  try {
    decoded = jwt.decode(token, TOKEN_SECRET);
  } catch (e) {
    // Token is invalid, can't be decoded;
    // "Error: Signature verification failed"
    return { error: true };
  }

  if (user.name === decoded.user.name && user.email === decoded.user.email) {
    if (decoded.expires > new Date().getTime()) {
      // Valid, fill un with the user info and let him through:
      return { valid: true };
    } else {
      // expired
      return { expired: true };
    }
  } else {
    // invalid token
    return { invalid: true };
  }
}