// Load environment
const config = require('../config')
// Name of theme used in configuration
const theme = `genkan-theme-${config.genkan.theme}`

// MongoDB
const MongoClient = require('mongodb').MongoClient
const url = config.mongo.url
const dbName = config.mongo.database
require('../db')

// UUID & Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')
const saltRounds = 10

// Token Generator
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
const confirmEmailSource = fs.readFileSync(`node_modules/${theme}/mail/confirmation.hbs`, 'utf8')
const confirmEmailTemplate = Handlebars.compile(confirmEmailSource)

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    const db = client.db(dbName)
    newAccount = (email, password, callback) => {
    // Check for duplicate accounts
        findDB(db, 'users', { 'email': email }, (result) => {
            // Reject if duplicate
            if (result.length !== 0) {
                return callback(false)
            }

            // SHA512 Hashing
            const hashedPasswordSHA512 = sha512({
                a: password,
                b: email + config.genkan.secretKey,
            })

            // Bcrypt Hashing
            const hashedPasswordSHA512Bcrypt = bcrypt.hashSync(hashedPasswordSHA512, saltRounds)

            // Generate email confirmation token
            const emailConfirmationToken = tokenGenerator()

            const NewUserSchema = {
                'email': email,
                'password': hashedPasswordSHA512Bcrypt,
                'account': {
                    'activity': {
                        'created': new Date(),
                        'lastSeen': null,
                    },
                    'type': 'STANDARD',
                    'suspended': false,
                    'emailVerified': false,
                },
                'tokens': {
                    'emailConfirmation': emailConfirmationToken,
                },
            }

            // Insert new user into database
            insertDB(db, 'users', NewUserSchema, () => {
                callback(true)
                sendConfirmationEmail(email, emailConfirmationToken)
            })
        })
    }

    sendConfirmationEmail = (email, token) => {
    // Compile from email template
        const data = {
            receiver: email,
            url: `https://id.hakkou.app/register?confirmation=${token}`,
        }
        const message = confirmEmailTemplate(data)

        // send email
        transporter.sendMail({
            from: config.smtp.mailFromAddress,
            to: email,
            subject: 'Confirm your HakkouID',
            html: message,
        })
    }

    confirmEmail = (token, callback) => {
        findDB(db, 'users', { 'tokens.emailConfirmation': token }, (result) => {
            if (result.length !== 1) {
                return callback(false)
            }
            const AccountActivatePayload = {
                $unset: {
                    'tokens.emailConfirmation': 1,
                },
                $set: {
                    'account.emailVerified': true,
                },
            }

            updateDB(db, 'users', { 'tokens.emailConfirmation': token }, AccountActivatePayload, () => {
                callback(true)
            })
        })
    }

    module.exports = newAccount
    module.exports = confirmEmail
})
