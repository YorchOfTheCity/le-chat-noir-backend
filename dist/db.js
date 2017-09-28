"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const PWDHash = require("password-hash-and-salt");
const user_1 = require("./schemas/user");
const constants = require("./constants");
const authentication_1 = require("./authentication");
const invite_1 = require("./schemas/invite");
const socketsComm_1 = require("./socketsComm");
mongoose.connect(constants.MONGO_URL);
// Mongoose's promise library is deprecated, we'll switch it here with node's default one:
mongoose.Promise = global.Promise;
var db = mongoose.connection;
function userAvailable(req, res) {
    const username = req.query.username;
    const prom = user_1.UsersModel.findOne({ name: username }).exec();
    prom.then((userDoc) => {
        if (userDoc) {
            res.json({ username, available: false });
        }
        else {
            res.json({ username, available: true });
        }
    }, (rejectReason) => {
        handleError(req, res, rejectReason);
    });
}
exports.userAvailable = userAvailable;
function insertUser(req, res) {
    let user = { name: req.body.username, email: req.body.email, pwdHash: req.body.password };
    saveUser(user).then((userDoc) => {
        // success
        res.json(authentication_1.auth.genToken(new user_1.User(userDoc.name, userDoc.email, null)));
    }, (error) => {
        // reject
        handleError(req, res, error);
    });
}
exports.insertUser = insertUser;
function emailAvailable(req, res) {
    const email = req.query.email;
    const prom = user_1.UsersModel.findOne({ email }).exec();
    prom.then((userDoc) => {
        if (userDoc) {
            res.json({ email, available: false });
        }
        else {
            res.json({ email, available: true });
        }
    }, (rejectReason) => {
        handleError(req, res, rejectReason);
    });
}
exports.emailAvailable = emailAvailable;
function saveUser(user) {
    return new Promise(function (resolve, reject) {
        PWDHash(user.pwdHash).hash(function (error, hash) {
            if (error) {
                return reject("User couldn't be saved");
            }
            user.pwdHash = hash;
            const model = new user_1.UsersModel(user);
            return resolve(model.save());
        });
    });
}
exports.saveUser = saveUser;
function getUser(username, pwd) {
    const prom = user_1.UsersModel.findOne({ name: username }).exec();
    return prom.then(function (userDoc) {
        return new Promise(function (resolve, reject) {
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
                }
                else {
                    return reject('not found');
                }
            });
        });
    }, (rejectReason) => {
        console.log('rejected');
        return null;
    });
}
exports.getUser = getUser;
function getContacts(req, res) {
    // const token = json.token;
    const user = req.user;
    user_1.UsersModel.findOne({ name: user.name }, (err, dbUser) => {
        if (err) {
            handleError(req, res, err);
        }
        else {
            res.json(dbUser.contacts.map((contact) => ({ name: contact.name })));
        }
    });
}
exports.getContacts = getContacts;
function getInvitesHttp(req, res) {
    const user = req.user;
    invite_1.InviteModel.find({ name: user.name }, (err, invites) => {
        if (err) {
            handleError(req, res, err);
        }
        else {
            res.json(invites.map((invite) => (new invite_1.Invite(invite.name, invite.contact, invite.accept))));
        }
    });
}
exports.getInvitesHttp = getInvitesHttp;
function addContact(req, res) {
    let idOrEmail = req.params.contact;
    let field;
    if (idOrEmail.indexOf('@') === -1) {
        field = 'name';
    }
    else {
        field = 'email';
    }
    user_1.UsersModel.findOne({ [field]: idOrEmail }, (err, dbRes) => {
        if (!dbRes) {
            // There is no user with that name/email.
            return res.json({
                'message': 'User not found'
            });
        }
        if (err) {
            handleError(req, res, err);
        }
        else {
            user_1.UsersModel.findOne({ name: req.user.name }, (err, user) => {
                if (err) {
                    handleError(req, res, err);
                }
                else {
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
                    }
                    else {
                        res.json({
                            'message': 'User already in contacts'
                        });
                    }
                }
            });
        }
    });
}
exports.addContact = addContact;
function inviteContact(req, res) {
    let idOrEmail = req.params.contact;
    let field;
    if (idOrEmail.indexOf('@') === -1) {
        field = 'name';
    }
    else {
        field = 'email';
    }
    user_1.UsersModel.findOne({ [field]: idOrEmail }, (err, invitee) => {
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
            invite_1.InviteModel.findOne({ name: req.user.name, contact: invitee.name }, (err, invite) => {
                if (err) {
                    handleError(req, res, err);
                }
                else {
                    if (invite) {
                        // User exists... reply that invite was already sent.
                        return res.json({
                            'message': 'User already invited'
                        });
                    }
                    else {
                        // Check if the user is already on his list of contacts
                        for (let i = 0; i < req.user.contacts.length; i++) {
                            if (req.user.contacts.name === invitee.name) {
                                return res.json({
                                    'message': 'User already in contacts'
                                });
                            }
                        }
                        const invite = { name: req.user.name, contact: invitee.name };
                        const model = new invite_1.InviteModel(invite);
                        model.save((err, invite) => {
                            socketsComm_1.inviteRequestSubject.next(invite); // Fire invite event in case user is online when the invite is sent.
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
exports.inviteContact = inviteContact;
function dropDatabase() {
    return db.dropDatabase();
}
exports.dropDatabase = dropDatabase;
function getUserInner(username) {
    return user_1.UsersModel.findOne({ name: username }).exec();
}
exports.getUserInner = getUserInner;
function getInvites(username) {
    return invite_1.InviteModel.find({ contact: username }).exec();
}
exports.getInvites = getInvites;
function getNonRespondedInvites(username) {
    return invite_1.InviteModel.find({ contact: username, accept: undefined }).exec();
}
exports.getNonRespondedInvites = getNonRespondedInvites;
function getInvite(username, contactName) {
    return invite_1.InviteModel.findOne({ name: username, contact: contactName }).exec();
}
exports.getInvite = getInvite;
function handleError(req, res, err) {
    res.status(500);
    res.json({
        'status': 500,
        'message': 'Internal server error'
    });
}
//# sourceMappingURL=db.js.map