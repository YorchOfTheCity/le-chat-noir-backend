"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../schemas/user");
const db = require("../db");
const invite_1 = require("../schemas/invite");
const users = [
    new user_1.User('yorch', 'yorch@tekmexico.com', 'qwertyuiop', [{ name: 'lalo' }]),
    new user_1.User('angie', 'angie@tekmexico.com', 'qwertyuiop', [{ name: 'lalo' }]),
    new user_1.User('lalo', 'lalo@tekmexico.com', 'qwertyuiop', []),
];
const invites = [
    new invite_1.Invite('yorch', 'angie', undefined),
];
db.dropDatabase().then(() => {
    users.forEach(user => {
        console.dir(user);
        db.saveUser(user);
    });
    invites.forEach((invite) => {
        const model = new invite_1.InviteModel(invite);
        model.save();
    });
});
//# sourceMappingURL=initDB.js.map