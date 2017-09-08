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
  if (username !== 'yorch') {
    res.json({ username: username, available: true });
  } else {
    res.json({ username: username, available: false });
  }
}

export function saveUser(user: User) {
  PWDHash(user.pwdHash).hash(function (error, hash) {
    if (error) {
      throw new Error('Something went wrong!');
    }
    user.pwdHash = hash;
    const model = new UsersModel(user);
    model.save();
  });
}

export function getUser(username: string, pwd: string): Promise<UserDocument>{
  const prom = UsersModel.findOne({ name: username }).exec();

  return prom.then( function(userDoc: UserDocument): Promise<UserDocument> {
    console.log(userDoc);
    return new Promise<UserDocument>(function (resolve, reject) {
      if(!userDoc){
        return reject('not found');
      }
      PWDHash(pwd).verifyAgainst(userDoc.pwdHash, (error, verified) => {
        if(error){
          reject('error verifying');
          return;
        }
        if(verified){
          return resolve(userDoc);
        }else{
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