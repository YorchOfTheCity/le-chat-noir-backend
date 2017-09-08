"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getHash(password) {
    password('mysecret').hash(function (error, hash) {
        if (error) {
            throw new Error('Something went wrong!');
        }
        // Store hash (incl. algorithm, iterations, and salt)
        myuser.hash = hash;
        console.dir(myuser.hash);
        // Verifying a hash
        password('mysecret').verifyAgainst(myuser.hash, function (error, verified) {
            if (error) {
                throw new Error('Something went wrong!');
            }
            if (!verified) {
                console.log("Don't try! We got you!");
            }
            else {
                console.log('The secret is...');
            }
        });
    });
}
exports.getHash = getHash;
//# sourceMappingURL=crypto.js.map