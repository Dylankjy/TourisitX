// Load environment
const config = require('../config')
// Name of theme used in configuration
const theme = `genkan-theme-${config.genkan.theme}`

// MongoDB
const MongoClient = require('mongodb').MongoClient
const url = config.mongo.url
const dbName = config.mongo.database
require('../db')

// Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')
const saltRounds = 12

// Token generator
const tokenGenerator = require('./tokenGenerator')

// NodeMailer
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
    host: config.smtp.server,
    port: config.smtp.port,
    auth: {
        user: config.smtp.username,
        pass: config.smtp.password,
    },
})

// Handlebars
const Handlebars = require('handlebars')

// Email Template
const fs = require('fs')
const pwdResetEmailSource = fs.readFileSync(`node_modules/${theme}/mail/pwdreset.hbs`, 'utf8')
const pwdResetEmailTemplate = Handlebars.compile(pwdResetEmailSource)

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    const db = client.db(dbName)

    sendResetPasswordEmail = (email, callback) => {
        findDB(db, config.mongo.collection, { 'email': email }, (result) => {
            if (result.length !== 1) {
                return callback(false)
            }

            const token = tokenGenerator()

            const SetTokenPayload = {
                $set: {
                    'tokens.resetPassword': token,
                },
            }

            updateDB(db, config.mongo.collection, { 'email': email }, SetTokenPayload, () => {
                // Compile from email template
                const data = {
                    receiver: email,
                    url: `https://${config.webserver.genkanDomain}/reset?token=${token}`,
                }
                const message = pwdResetEmailTemplate(data)

                // send email
                transporter.sendMail({
                    from: config.smtp.mailFromAddress,
                    to: email,
                    subject: config.smtp.customisation.resetPassword.subject,
                    html: message,
                })

                return callback(true)
            })
        })
    }

    resetPassword = (resetPasswordToken, newPassword, callback) => {
        findDB(db, config.mongo.collection, { 'tokens.resetPassword': resetPasswordToken }, (result) => {
            if (result.length !== 1) {
                return callback(false)
            }

            // SHA512 Hashing
            const hashedPasswordSHA512 = sha512({
                a: newPassword,
                b: result[0].email + config.genkan.secretKey,
            })

            // Bcrypt Hashing
            const hashedPasswordSHA512Bcrypt = bcrypt.hashSync(hashedPasswordSHA512, saltRounds)

            const SetPasswordPayload = {
                $set: {
                    'password': hashedPasswordSHA512Bcrypt,
                },
                $unset: {
                    'tokens.resetPassword': 1,
                },
            }

            updateDB(db, config.mongo.collection, { 'tokens.resetPassword': resetPasswordToken }, SetPasswordPayload, () => {
                callback(true)
            })
        })
    }

    module.exports = resetPassword
})
