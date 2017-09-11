import { Request, Response } from 'express';
import * as mongoose from 'mongoose'
import * as PWDHash from 'password-hash-and-salt';

import { User, UsersModel, UserDocument } from './schemas/user';
import * as constants from './constants';

mongoose.connect(constants.MONGO_URL);
// Mongoose's promise library is deprecated, we'll switch it here with node's default one:
(<any>mongoose).Promise = global.Promise;
var db = mongoose.connection;



export function userAvailable(req: Request, res: Response) {
  const username: string = req.query.username;
  const prom = UsersModel.findOne({ name: username }).exec();

  prom.then(
    (userDoc: UserDocument) => {
      if (userDoc) {
        res.json({ username, available: false });
      } else {
        res.json({ username, available: true });
      }
    },
    (rejectReason) => {
      console.log(rejectReason);
      res.status(500);
      res.json({
        'status': 500,
        'message': 'Internal server error'
      });
    }
  );
}

export function insertUser(req: Request, res: Response) {
  let user: User = { name: req.body.username, email: req.body.email, pwdHash: req.body.password }

  saveUser(user).then(
    (userDocument: UserDocument) => {
      // success
      res.json({ userDocument, success: true });
    },
    (error: Error) => {
      // reject
      res.status(500);
      res.json({
        'status': 500,
        'message': 'Internal server error'
      });
    }
  );
}

export function emailAvailable(req: Request, res: Response) {
  const email: string = req.query.email;
  const prom = UsersModel.findOne({ email }).exec();

  prom.then(
    (userDoc: UserDocument) => {
      if (userDoc) {
        res.json({ email, available: false });
      } else {
        res.json({ email, available: true });
      }
    },
    (rejectReason) => {
      res.status(500);
      res.json({
        'status': 500,
        'message': 'Internal server error'
      });
    }
  );
}

export function saveUser(user: User): Promise<UserDocument> {

  return new Promise<UserDocument>(function (resolve, reject) {
    PWDHash(user.pwdHash).hash(function (error, hash) {
      if (error) {
        return reject("User couldn't be saved");
      }
      user.pwdHash = hash;
      const model = new UsersModel(user);
      return resolve(model.save());
    });
  });
}

export function getUser(username: string, pwd: string): Promise<UserDocument> {
  const prom = UsersModel.findOne({ name: username }).exec();

  return prom.then(function (userDoc: UserDocument): Promise<UserDocument> {
    return new Promise<UserDocument>(function (resolve, reject) {
      if (!userDoc) {
        return reject('not found');
      }
      PWDHash(pwd).verifyAgainst(userDoc.pwdHash, (error, verified) => {
        if (error) {
          reject('error verifying');
          return;
        }
        if (verified) {
          return resolve(userDoc);
        } else {
          return reject('not found');
        }
      });
    })
  }, (rejectReason) => {
    console.log('rejected');
    return null;
  });
}

export function dropDatabase(): Promise<void> {
  return db.dropDatabase();
}