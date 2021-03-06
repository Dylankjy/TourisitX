// This file mostly contains methods to use in other to get certain variables out.
// I made this because we are all lazy people and no one gives 10 flying shits about SQLize.
// -- Dylan

// Database operations
require('../db')

// UUID & Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')
const saltRounds = 12

const config = require('../../config/genkan.json')

getUserByID = (uid, callback) => {
    findDB('user', { 'id': uid }, (userResult) => {
        if (userResult.length !== 1) {
            return callback(null)
        }

        return callback(userResult[0].dataValues)
    })
}

getUserByIDAsync = (uid, callback) => {
    return new Promise((res) => {
        findDB('user', { 'id': uid }, (userResult) => {
            if (userResult.length !== 1) {
                return res(null)
            }

            return res(userResult[0].dataValues)
        })
    })
}

getUserBySession = (sid, callback) => {
    findDB('session', { 'sessionId': sid }, (sessionResult) => {
        if (sessionResult.length !== 1) {
            return callback(null)
        }

        getUserByID(sessionResult[0].dataValues.userId, (userResult) => {
            // Remove sensitive information
            delete userResult.password
            delete userResult.ip_address
            delete userResult.stripe_id
            return callback(userResult)
        })
    })
}

getUserBySessionAsync = (sid) => {
    return new Promise((res, rej)=>{
        findDB('session', { 'sessionId': sid }, (sessionResult) => {
            if (sessionResult.length !== 1) {
                rej(new Error(null))
            }

            getUserByID(sessionResult[0].dataValues.userId, (userResult) => {
                // Remove sensitive information
                delete userResult.password
                delete userResult.ip_address
                delete userResult.stripe_id
                res(userResult)
            })
        })
    })
}

getUserBySessionDangerous = (sid, callback) => {
    findDB('session', { 'sessionId': sid }, (sessionResult) => {
        if (sessionResult.length !== 1) {
            return callback(null)
        }

        getUserByID(sessionResult[0].dataValues.userId, (userResult) => {
            return callback(userResult)
        })
    })
}

isLoggedin = (sid, callback) => {
    if (sid === undefined) {
        return callback(false)
    }

    findDB('session', { 'sessionId': sid }, (result) => {
        if (result.length !== 1) {
            return callback(false)
        }

        return callback(true)
    })
}

updateLastSeenByID = (uid) => {
    const UpdateLastSeenPayload = {
        'lastseen_time': (new Date()).toISOString(),
    }

    updateDB('user', { 'id': uid }, UpdateLastSeenPayload, () => {})
}

isAdmin = (sid, callback) => {
    if (sid === undefined) {
        return callback(false)
    }

    findDB('session', { 'sessionId': sid }, (result) => {
        if (result.length !== 1) {
            return callback(false)
        }

        findDB('user', { 'id': result[0].dataValues.userId, 'is_admin': true }, (user) => {
            if (user.length !== 1) {
                return callback(false)
            }

            callback(true)
        })
    })
}

isLoggedinAsync = (sid) => {
    return new Promise((res, rej)=>{
        if (sid === undefined) {
            rej(new Error(false))
        }

        findDB('session', { 'sessionId': sid }, (result) => {
            if (result.length !== 1) {
                rej(new Error(false))
            }

            const UpdateLastSeenPayload = {
                'lastseen_time': (new Date()).toISOString(),
            }

            updateDB('user', { 'id': result[0].dataValues.userId }, UpdateLastSeenPayload, () => {
                res(true)
            })
        })
    })
}

setPassword = (sid, newPassword, callback) => {
    getUserBySession(sid, (userObject) => {
        if (userObject === null) {
            return callback(false)
        }

        // SHA512 Hashing
        const hashedPasswordSHA512 = sha512({
            a: newPassword,
            b: config.genkan.secretKey,
        })

        // Bcrypt Hashing
        const hashedPasswordSHA512Bcrypt = bcrypt.hashSync(hashedPasswordSHA512, saltRounds)

        const UpdatePasswordPayload = {
            'password': hashedPasswordSHA512Bcrypt,
        }

        updateDB('user', { 'id': userObject.id }, UpdatePasswordPayload, (status) => {
            return callback(true)
        })
    })
}

// getUserBySession('d237a174694b00af29a22c7db8cb4974d8c4754656b913879452b433f4624d38947d17a31cb8bad396b7307e3d1683c99c5a76f1748e3f8b8fe8398b7801658e', (result) => {
//     console.log(result)
// })

// isLoggedin('d237a174694b00af29a22c7db8cb4974d8c4754656b913879452b433f4624d38947d17a31cb8bad396b7307e3d1683c99c5a76f1748e3f8b8fe8398b7801658e', (result) => {
//     console.log(result)
// })

// module.exports = getUserByID
// module.exports = getUserBySession
// module.exports = getUserBySessionDangerous
// module.exports = isLoggedin
// module.exports = setPassword

module.exports = {
    getUserByID,
    getUserByIDAsync,
    getUserBySession,
    getUserBySessionAsync,
    getUserBySessionDangerous,
    isLoggedin,
    updateLastSeenByID,
    isAdmin,
    isLoggedinAsync,
    setPassword,
}
