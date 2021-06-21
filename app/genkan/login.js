// Load environment
const config = require('../config')

// MongoDB
const MongoClient = require('mongodb').MongoClient
const url = config.mongo.url
const dbName = config.mongo.database
require('../db')

// Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')

// Token Generator
const tokenGenerator = require('./tokenGenerator')

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) throw err

    const db = client.db(dbName)
    loginAccount = (email, password, callback) => {
    // SHA512 Hashing
        const incomingHashedPasswordSHA512 = sha512({
            a: password,
            b: email + config.genkan.secretKey,
        })

        // Find account to get stored hashed
        findDB(db, config.mongo.collection, { 'email': email }, (result) => {
            // If no account found
            if (result.length !== 1) {
                return callback(false)
            }
            // Compare whether incoming is the same as stored
            if (bcrypt.compareSync(incomingHashedPasswordSHA512, result[0].password)) {
                // Generate a random token for SID
                const sid = tokenGenerator()

                // Schema for sessions in session collection
                const SessionSchema = {
                    'uid': result[0]._id,
                    'sid': sid,
                    // Why is this in ISOString you ask? Because some stinky reason, MongoDB returns a completely empty object when attempting to .find().
                    'timestamp': (new Date()).toISOString(),
                    'createdTimestamp': new Date(),
                }

                // Payload to update user's last seen in users collection
                const UpdateLastSeenPayload = {
                    $set: {
                        'account.activity.lastSeen': new Date(),
                    },
                }

                // Update database
                insertDB(db, 'sessions', SessionSchema, () => {
                    updateDB(db, config.mongo.collection, { 'email': email }, UpdateLastSeenPayload, () => {
                        return callback(sid)
                    })
                })
            } else {
                // If account details are invalid, reject
                return callback(false)
            }
        })
    }

    isLoggedin = (sid, callback) => {
        if (sid === undefined) {
            return callback(false)
        }

        findDB(db, 'sessions', { 'sid': sid }, (result) => {
            if (result.length !== 1) {
                return callback(false)
            }

            // Get time difference between last accessed date and current date
            const timeNow = new Date()
            const storedDate = new Date(result[0].timestamp)
            const diffTime = Math.abs(timeNow - storedDate)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays > 31) {
                deleteDB(db, 'sessions', { 'sid': sid }, () => {
                    return callback(false)
                })
            }

            const UpdateTimestampPayload = {
                $set: {
                    'timestamp': (new Date()).toISOString(),
                },
            }

            updateDB(db, 'sessions', { 'sid': sid }, UpdateTimestampPayload, () => {
                callback(true)
            })
        })
    }

    module.exports = loginAccount
})
