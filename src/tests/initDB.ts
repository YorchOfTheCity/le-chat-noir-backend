import * as mongoose from 'mongoose';

import * as constants from '../constants';
import { User, UserDocument, UsersModel } from '../schemas/user';
import * as db from '../db';

const users = [
  new User('yorch', 'yorch@tekmexico.com', 'qwertyuiop'),
  new User('angie', 'angie@tekmexico.com', 'qwertyuiop'),
  new User('lalo', 'lalo@tekmexico.com', 'qwertyuiop'),
];

db.dropDatabase().then( () =>
users.forEach(user => {
  db.saveUser(user);
}));