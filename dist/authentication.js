"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jwt-simple");
const user_1 = require("./schemas/user");
const db = require("./db");
const TOKEN_SECRET = 'tL7CM579pL0WD8^9%v9)7O&b>ge-jY78-j953yl$D06796k6';
const TOKEN_EXPIRATION_DAYS = 30;
const MILLIS_IN_DAY = 1000 * 60 * 60 * 24;
exports.auth = {
    login(req, res) {
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
    validToken(req, res, next) {
        console.log('debugging');
        const json = JSON.parse(req.query.body);
        const token = json.token;
        const user = json.user;
        let decoded;
        try {
            decoded = jwt.decode(token, TOKEN_SECRET);
        }
        catch (e) {
            // Token is invalid, can't be decoded;
            // "Error: Signature verification failed"
            res.status(401);
            res.json({
                'status': 401,
                'message': 'Invalid token'
            });
        }
        if (user.name === decoded.user.name && user.email === decoded.user.email) {
            if (decoded.expires > new Date().getTime()) {
                // Valid, fill un with the user info and let him through:
                next();
            }
            else {
                // expired
                res.status(401);
                res.json({
                    'status': 401,
                    'message': 'Session expired'
                });
            }
        }
        else {
            // invalid token
            res.status(401);
            res.json({
                'status': 401,
                'message': 'Invalid credentials'
            });
        }
    },
    getUser(req) {
        const json = JSON.parse(req.query.body);
        return json.user;
    },
    genToken
};
function genToken(user) {
    var expires = expiresIn(TOKEN_EXPIRATION_DAYS);
    var token = jwt.encode({
        expires: expires,
        user: user
    }, TOKEN_SECRET);
    return {
        // TODO: return email and username in plain text for frontend to consume
        token: token,
        expires: expires,
        user: user
    };
}
function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.getTime() + (TOKEN_EXPIRATION_DAYS * MILLIS_IN_DAY);
}
//# sourceMappingURL=authentication.js.map