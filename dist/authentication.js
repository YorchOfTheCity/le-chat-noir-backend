"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jwt = require("jwt-simple");
var TOKEN_SECRET = 'tL7CM579pL0WD8^9%v9)7O&b>ge-jY78-j953yl$D06796k6';
var TOKEN_EXPIRATION = 30; // days
exports.auth = {
    login: function (req, res) {
        var username = req.query.username || '';
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
        var dbUserObj = exports.auth.validate(username, password);
        if (!dbUserObj) {
            res.status(401);
            res.json({
                'status': 401,
                'message': 'Invalid credentials'
            });
            return;
        }
        if (dbUserObj) {
            // If authentication is success, we will generate a token
            // and dispatch it to the client
            res.json(genToken(dbUserObj));
        }
    },
    validate: function (username, password) {
        // spoofing the DB response for simplicity
        var dbUserObj = {
            name: 'arvind',
            role: 'admin',
            username: 'arvind@myapp.com'
        };
        return dbUserObj;
    },
    validateUser: function (username) {
        // spoofing the DB response for simplicity
        var dbUserObj = {
            name: 'arvind',
            role: 'admin',
            username: 'arvind@myapp.com'
        };
        return dbUserObj;
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