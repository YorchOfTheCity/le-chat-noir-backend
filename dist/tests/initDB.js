"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../schemas/user");
const db = require("../db");
const users = [
    new user_1.User('yorch', 'yorch@tekmexico.com', 'qwertyuiop', [{ name: 'lalo' }]),
    new user_1.User('angie', 'angie@tekmexico.com', 'qwertyuiop', [{ name: 'lalo' }]),
    new user_1.User('lalo', 'lalo@tekmexico.com', 'qwertyuiop', []),
];
db.dropDatabase().then(() => users.forEach(user => {
    console.dir(user);
    db.saveUser(user);
}));
//# sourceMappingURL=initDB.js.map