// Load environment
const config = require('./config')

// MongoDB
const MongoClient = require('mongodb').MongoClient
const url = config.mongo.url
const dbName = config.mongo.database
require('../db')

// Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    const db = client.db(dbName)

    resetPassword = (resetPasswordToken, newPassword, callback) => {
        findDB(db, 'users', { 'resetPassword': resetPasswordToken }, (result) => {
            if (result.length !== 1) {
                return callback(false)
            }

            // SHA512 Hashing
            const hashedPasswordSHA512 = sha512({
                a: newPassword,
                b: email,
            })

            // Bcrypt Hashing
            const hashedPasswordSHA512Bcrypt = bcrypt.hashSync(hashedPasswordSHA512, saltRounds)

            const SetPasswordPayload = {
                $set: {
                    'password': hashedPasswordSHA512Bcrypt,
                },
            }

            insertDB(db, 'users', { 'resetPassword': resetPasswordToken }, SetPasswordPayload, () => {
                callback(true)
            })
        })
    }

    module.exports = resetPassword
})
