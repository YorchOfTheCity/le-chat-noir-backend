"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const PWDHash = require("password-hash-and-salt");
const user_1 = require("./schemas/user");
const constants = require("./constants");
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
        console.log(rejectReason);
        res.status(500);
        res.json({
            'status': 500,
            'message': 'Internal server error'
        });
    });
}
exports.userAvailable = userAvailable;
function insertUser(req, res) {
    let user = { name: req.body.username, email: req.body.email, pwdHash: req.body.password };
    saveUser(user).then((userDocument) => {
        // success
        res.json({ userDocument, success: true });
    }, (error) => {
        // reject
        res.status(500);
        res.json({
            'status': 500,
            'message': 'Internal server error'
        });
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
        res.status(500);
        res.json({
            'status': 500,
            'message': 'Internal server error'
        });
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
function dropDatabase() {
    return db.dropDatabase();
}
exports.dropDatabase = dropDatabase;
//# sourceMappingURL=db.js.map