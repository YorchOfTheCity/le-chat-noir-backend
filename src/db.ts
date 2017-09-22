import { Request, Response } from 'express';
import * as mongoose from 'mongoose'
import * as PWDHash from 'password-hash-and-salt';

import { User, UsersModel, UserDocument } from './schemas/user';
import * as constants from './constants';
import { auth } from './authentication'
import { InviteModel, Invite, InviteDocument } from './schemas/invite';
import { inviteRequestSubject } from './socketsComm';

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
      handleError(req, res, rejectReason);
    }
  );
}

export function insertUser(req: Request, res: Response) {
  let user: User = { name: req.body.username, email: req.body.email, pwdHash: req.body.password }

  saveUser(user).then(
    (userDoc: UserDocument) => {
      // success
      res.json(auth.genToken(new User(userDoc.name, userDoc.email, null)));
    },
    (error: Error) => {
      // reject
      handleError(req, res, error);
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
      handleError(req, res, rejectReason);
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

export function getContacts(req: Request, res: Response) {

  // const token = json.token;
  const user: User = (req as any).user;

  UsersModel.findOne({ name: user.name },
    (err, dbUser) => {
      if (err) {
        handleError(req, res, err);
      } else {
        res.json(dbUser.contacts.map((contact) => ({ name: contact.name })));
      }
    });
}

export function getInvitesHttp(req: Request, res: Response) {
  const user: User = (req as any).user;
  InviteModel.find({ name: user.name },
    (err, invites) => {
      if (err) {
        handleError(req, res, err);
      } else {
        res.json(invites.map((invite) => ( new Invite(invite.name, invite.contact, invite.accept) )));
      }
    });
}

export function addContact(req: any, res: Response) {
  let idOrEmail: string = req.params.contact;
  let field: string;
  if (idOrEmail.indexOf('@') === -1) {
    field = 'name';
  } else {
    field = 'email';
  }
  UsersModel.findOne({ [field]: idOrEmail },
    (err, dbRes) => {
      if (!dbRes) {
        // There is no user with that name/email.
        return res.json({
          'message': 'User not found'
        });
      }
      if (err) {
        handleError(req, res, err);
      } else {
        UsersModel.findOne({ name: req.user.name }, (err, user) => {
          if (err) {
            handleError(req, res, err);
          } else {
            // Add the contact to the user's contact list and reply
            // TODO: Check if user already exists... don't save if it does...
            // TODO: Send modal for success/failure? And waiting icon?
            const tmp = user.contacts.filter(({ name }) => name === dbRes.name);
            if (tmp.length === 0) {
              // Contact doesn't exist, we'll add it.
              user.contacts.push({ name: dbRes.name });
              user.save((err, updatedContact) => {
                if (err) {
                  return handleError(req, res, err);
                }
                res.json({ name: dbRes.name, email: dbRes.email });
              });
            } else {
              res.json({
                'message': 'User already in contacts'
              });
            }
          }
        });
      }
    });
}

export function inviteContact(req: any, res: Response) {
  let idOrEmail: string = req.params.contact;
  let field: string;
  if (idOrEmail.indexOf('@') === -1) {
    field = 'name';
  } else {
    field = 'email';
  }
  UsersModel.findOne({ [field]: idOrEmail },
    (err, invitee) => {
      if (err) {
        handleError(req, res, err);
        return;
      }
      if (!invitee) {
        // There is no user with that name/email.
        return res.json({
          'message': 'User not found'
        });
      }
      else {
        // Check if there is already an invite for this user/contact... don't save if it does...
        InviteModel.findOne({ name: req.user.name, contact: invitee.name },
          (err, invite) => {
            if (err) {
              handleError(req, res, err);
            } else {
              if (invite) {
                // User exists... reply that invite was already sent.
                return res.json({
                  'message': 'User already invited'
                });
              } else {
                // Check if the user is already on his list of contacts
                for(let i=0; i<req.user.contacts.length; i++){
                  if(req.user.contacts.name === invitee.name){
                    return res.json({
                      'message': 'User already in contacts'
                    });
                  }
                }
                const invite: Invite = { name: req.user.name, contact: invitee.name };
                const model = new InviteModel(invite);
                model.save( (err, invite) => {
                  inviteRequestSubject.next(invite); // Fire invite event in case user is online when the invite is sent.
                  return res.json({
                    name: invite.contact
                  });
                });
              }
            }
          });
      }
    });
}

export function dropDatabase(): Promise<void> {
  return db.dropDatabase();
}

export function getUserInner(username: String): Promise<UserDocument> {
  return UsersModel.findOne({ name: username }).exec();
}

export function getInvites(username: String): Promise<InviteDocument[]> {
  return InviteModel.find({ name: username }).exec();
}

export function getInvite(username: String, contactName: String): Promise<InviteDocument> {
  return InviteModel.findOne({ name: username, contact: contactName }).exec();
}

function handleError(req: Request, res: Response, err: Error) {
  res.status(500);
  res.json({
    'status': 500,
    'message': 'Internal server error'
  });
}
