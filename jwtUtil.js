const jwt = require('jsonwebtoken');
const Promise = require('bluebird');

function createJWT(user_id, username, isFinanceManager) {
    return jwt.sign({
        user_id,
        username,
        isFinanceManager
        }, 'thisisasecret', {
            expiresIn: '1d'
        })
}

jwt.verify = Promise.promisify(jwt.verify);

function verifyTokenAndReturnPayload(token) {
    return jwt.verify(token, 'thisisasecret');
}

module.exports = {
    createJWT, verifyTokenAndReturnPayload
}