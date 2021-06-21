// Load environment
const config = require('../config')

// MongoDB
const MongoClient = require('mongodb').MongoClient
const { ObjectId } = require('bson')
const url = config.mongo.url
const dbName = config.mongo.database
require('../db')

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) throw err

    const db = client.db(dbName)
    logoutAccount = (sid, isAll, callback) => {
        // Find account to get stored hashed
        findDB(db, 'sessions', { 'sid': sid }, (result) => {
            // If such session is found
            if (result.length !== 1) {
                return callback(false)
            }

            // Payload to update user's last seen in users collection
            const UpdateLastSeenPayload = {
                $set: {
                    'account.activity.lastSeen': new Date(),
                },
            }

            if (isAll === false) {
                deleteDB(db, 'sessions', { 'uid': result[0].uid }, () => {
                    updateDB(db, config.mongo.collection, { '_uid': ObjectId(result[0].uid) }, UpdateLastSeenPayload, () => {
                        return callback()
                    })
                })
            }

            // Update database
            deleteManyDB(db, 'sessions', { 'sid': sid }, () => {
                updateDB(db, config.mongo.collection, { '_uid': ObjectId(result[0].uid) }, UpdateLastSeenPayload, () => {
                    return callback()
                })
            })
        })
    }
    module.exports = logoutAccount
})
