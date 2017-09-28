import * as mongoose from 'mongoose';

import * as constants from '../constants';
import { User, UserDocument, UsersModel } from '../schemas/user';
import * as db from '../db';
import { Invite, InviteModel } from '../schemas/invite';

const users = [
  new User('yorch', 'yorch@tekmexico.com', 'qwertyuiop',
    [{ name: 'lalo' }]),
  new User('angie', 'angie@tekmexico.com', 'qwertyuiop',
    [{ name: 'lalo' }]),
  new User('lalo', 'lalo@tekmexico.com', 'qwertyuiop', []),
];

const invites = [
  new Invite('yorch', 'angie', undefined),
]

db.dropDatabase().then(() => {
  users.forEach(user => {
    console.dir(user);
    db.saveUser(user);
  });
  invites.forEach((invite) => {
    const model = new InviteModel(invite);
    model.save();
  });

});