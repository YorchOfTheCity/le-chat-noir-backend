"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jwt-simple");
const user_1 = require("./schemas/user");
const db = require("./db");
const TOKEN_SECRET = 'tL7CM579pL0WD8^9%v9)7O&b>ge-jY78-j953yl$D06796k6';
const TOKEN_EXPIRATION = 30; // days
exports.auth = {
    login: function (req, res) {
        var username = req.query.username.toLowerCase() || '';
        var password = req.query.password || '';
        if (username === '' || password === '') {
            res.status(401);
            res.json({
                'status': 401,
                'message': 'Invalid credentials'
            });
            return;
        }
        // TODO: Fire a query to your DB and check if the credentials are valid
        db.getUser(username, password).then((userDoc) => {
            if (!userDoc) {
                res.status(401);
                res.json({
                    'status': 401,
                    'message': 'Invalid credentials'
                });
                return;
            }
            if (userDoc) {
                // If authentication is success, we will generate a token
                // and dispatch it to the client
                res.json(genToken(new user_1.User(userDoc.name, userDoc.email, null)));
            }
        }, (rejectedReason) => {
            res.status(401);
            res.json({
                'status': 401,
                'message': 'Invalid credentials'
            });
        });
    },
};
// private method
function genToken(user) {
    var expires = expiresIn(TOKEN_EXPIRATION);
    var token = jwt.encode({
        expires: expires,
        user: user
    }, TOKEN_SECRET);
    return {
        // TODO: return email and username in plain text for Angular to consume
        token: token,
        expires: expires,
        user: user
    };
}
function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
}
//# sourceMappingURL=authentication.js.map