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
    if (username !== 'yorch') {
        res.json({ username: username, available: true });
    }
    else {
        res.json({ username: username, available: false });
    }
}
exports.userAvailable = userAvailable;
function saveUser(user) {
    PWDHash(user.pwdHash).hash(function (error, hash) {
        if (error) {
            throw new Error('Something went wrong!');
        }
        user.pwdHash = hash;
        const model = new user_1.UsersModel(user);
        model.save();
    });
}
exports.saveUser = saveUser;
function getUser(username, pwd) {
    const prom = user_1.UsersModel.findOne({ name: username }).exec();
    return prom.then(function (userDoc) {
        console.log(userDoc);
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