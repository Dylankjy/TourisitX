// This file mostly contains methods to use in other to get certain variables out.
// I made this because we are all lazy people and no one gives 10 flying shits about SQLize.
// -- Dylan

// Database operations
require('../db')

const getUserByID = (uid, callback) => {
    findDB('user', { 'id': uid }, (userResult) => {
        return callback(userResult[0].dataValues)
    })
}


const getUserBySession = (sid, callback) => {
    findDB('session', { 'sessionId': sid }, (sessionResult) => {
        if (sessionResult.length !== 1) {
            return callback(null)
        }

        getUserByID(sessionResult[0].dataValues.userId, (userResult) => {
            return callback(userResult)
        })
    })
}

module.exports = getUserByID
module.exports = getUserBySession
