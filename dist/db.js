"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: Mongonize this:
function userAvailable(req, res) {
    var username = req.query.username;
    if (username !== 'yorch') {
        res.json({ username: username, available: true });
    }
    else {
        res.json({ username: username, available: false });
    }
}
exports.userAvailable = userAvailable;
//# sourceMappingURL=db.js.map