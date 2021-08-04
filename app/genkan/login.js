// Load environment
const config = require('../../config/genkan.json')
const apikeys = require('../../config/apikeys.json')

// Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')

// Token Generator
const tokenGenerator = require('./tokenGenerator')

// Database operations
require('../db')

// NodeMailer
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
    host: config.smtp.server,
    port: config.smtp.port,
    auth: {
        user: config.smtp.username,
        pass: apikeys.secret.SENDGRID_KEY,
    },
})

// Handlebars
const Handlebars = require('handlebars')

// Unknown login email template
const fs = require('fs')
const unknownLoginSource = fs.readFileSync(
    `app/genkan/templates/unknown_login.hbs`,
    'utf8',
)
const unknownLoginTemplate = Handlebars.compile(unknownLoginSource)

loginAccount = (email, password, ip, deviceInfo, callback) => {
    // SHA512 Hashing
    const incomingHashedPasswordSHA512 = sha512({
        a: password,
        b: config.genkan.secretKey,
    })

    // Find account to get stored hashed
    findDB('user', { email: email }, (result) => {
    // If no account found
        if (result.length !== 1) {
            return callback(false)
        }

        // Compare whether incoming is the same as stored
        if (
            bcrypt.compareSync(
                incomingHashedPasswordSHA512,
                result[0].dataValues.password,
            )
        ) {
            if (result[0].dataValues.email_status === false) {
                return callback('EMAIL_NOT_VERIFIED')
            }

            console.table([ip, result[0].dataValues.ip_address])

            // Check whether IP address is known
            if (ip !== result[0].dataValues.ip_address) {
                sendUnknownLoginEmail(email, ip, deviceInfo)
            }

            // Generate a random token for SID
            const sid = tokenGenerator()

            // Schema for sessions in session collection
            const SessionSchema = {
                userId: result[0].id,
                sessionId: sid,
            }

            // Payload to update user's last seen in users collection
            const UpdateLastSeenPayload = {
                'ip_address': ip,
                'lastseen_time': new Date(),
            }

            // Update database
            insertDB('session', SessionSchema, () => {
                updateDB('user', { email: email }, UpdateLastSeenPayload, () => {
                    return callback(sid)
                })
            })
        } else {
            // If account details are invalid, reject
            return callback(false)
        }
    })
}

sendUnknownLoginEmail = (email, ip, deviceInfo) => {
    // Compile from email template
    const data = {
        receiver: email,
        details: {
            ip,
            browser: deviceInfo.browser,
            version: deviceInfo.version,
            os: deviceInfo.os,
            platform: deviceInfo.platform,
            source: deviceInfo.source,
        },
    }
    const message = unknownLoginTemplate(data)

    // send email
    transporter.sendMail({
        from: config.smtp.mailFromAddress,
        to: email,
        subject: config.smtp.customisation.unknownLogin.subject,
        html: message,
    })
}

// loginAccount('john.seedapple123@gmail.com', 'HelloWorld#1a3', () => { })

module.exports = loginAccount
