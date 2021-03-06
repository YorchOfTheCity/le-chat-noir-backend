"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
// 1) CLASS
class User {
    constructor(name, email, pwdHash, contacts) {
        this.name = name;
        this.email = email;
        this.pwdHash = pwdHash;
        this.contacts = contacts;
        if (!this.contacts) {
            this.contacts = [];
        }
    }
}
exports.User = User;
// no necessary to export the schema (keep it private to the module)
var schema = new mongoose.Schema({
    name: { required: true, type: String, lowercase: true, index: { unique: true } },
    email: { required: true, type: String, lowercase: true, index: { unique: true } },
    pwdHash: { required: true, type: String },
    contacts: [{ name: { type: String } }]
});
// 3) MODEL
exports.UsersModel = mongoose.model('User', schema);
//# sourceMappingURL=user.js.map