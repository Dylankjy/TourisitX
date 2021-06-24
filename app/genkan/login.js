// Load environment
const config = require('../../config/genkan.json')

// Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')

// Token Generator
const tokenGenerator = require('./tokenGenerator')

// Database operations
require('../db')

loginAccount = (email, password, callback) => {
    // SHA512 Hashing
    const incomingHashedPasswordSHA512 = sha512({
        a: password,
        b: email + config.genkan.secretKey,
    })

    // Find account to get stored hashed
    findDB('user', { 'email': email }, (result) => {
        // If no account found
        if (result.length !== 1) {
            return callback(false)
        }
        // Compare whether incoming is the same as stored
        if (bcrypt.compareSync(incomingHashedPasswordSHA512, result[0].dataValues.password)) {
            // Generate a random token for SID
            const sid = tokenGenerator()

            // Schema for sessions in session collection
            const SessionSchema = {
                'userId': result[0].id,
                'sessionId': sid,
            }

            // Payload to update user's last seen in users collection
            const UpdateLastSeenPayload = {
                'lastseen_time': new Date(),
            }

            // Update database
            insertDB('session', SessionSchema, () => {
                updateDB('user', { 'email': email }, UpdateLastSeenPayload, () => {
                    return callback(sid)
                })
            })
        } else {
            // If account details are invalid, reject
            return callback(false)
        }
    })
}

// loginAccount('john.seedapple123@gmail.com', 'Apples#@09812')

// isLoggedin = (sid, callback) => {
//     if (sid === undefined) {
//         return callback(false)
//     }

//     findDB(db, 'sessions', { 'sid': sid }, (result) => {
//         if (result.length !== 1) {
//             return callback(false)
//         }

//         // Get time difference between last accessed date and current date
//         const timeNow = new Date()
//         const storedDate = new Date(result[0].timestamp)
//         const diffTime = Math.abs(timeNow - storedDate)
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

//         if (diffDays > 31) {
//             deleteDB(db, 'sessions', { 'sid': sid }, () => {
//                 return callback(false)
//             })
//         }

//         const UpdateTimestampPayload = {
//             $set: {
//                 'timestamp': (new Date()).toISOString(),
//             },
//         }

//         updateDB(db, 'sessions', { 'sid': sid }, UpdateTimestampPayload, () => {
//             callback(true)
//         })
//     })
// }

module.exports = loginAccount
