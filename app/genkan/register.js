// Load environment
const config = require('../../config/genkan.json')

// UUID & Hashing
const uuid = require('uuid')
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')
const saltRounds = 12

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
// TODO: Enable this when the email templates are done
// const fs = require('fs')
// const confirmEmailSource = fs.readFileSync(`node_modules/${theme}/mail/confirmation.hbs`, 'utf8')
// const confirmEmailTemplate = Handlebars.compile(confirmEmailSource)

newAccount = (name, email, password, callback) => {
    // Check for duplicate accounts
    findDB('user', { 'email': email }, (result) => {
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
            'id': uuid.v1(),
            'name': name,
            'email': email,
            'password': hashedPasswordSHA512Bcrypt,
            'profile_img': '', // TODO: Add binary of Profile Image
            'lastseen_time': new Date(),
            'email_status': false,
            'phone_status': false,
            'account_type': 'USER',
            'verified': false,
            'ip_address': '', // TODO: Add IP Address mechanism
        }

        const TokenSchema = {
            'token': emailConfirmationToken,
            'type': 'EMAIL',
        }

        // Insert new user into database
        insertDB('user', NewUserSchema, () => {
            callback(true)
            // TODO: Enable this when the email templates are done
            // sendConfirmationEmail(email, emailConfirmationToken)
        })

        // Insert new email confirmation token into database
        insertDB('token', TokenSchema, () => {/* Do nothing */})
    })
}

sendConfirmationEmail = (email, token) => {
    // Compile from email template
    const data = {
        receiver: email,
        url: `https://${config.webserver.genkanDomain}/confirm?confirmation=${token}`,
    }
    const message = confirmEmailTemplate(data)

    // send email
    transporter.sendMail({
        from: config.smtp.mailFromAddress,
        to: email,
        subject: config.smtp.customisation.confirmation.subject,
        html: message,
    })
}

confirmEmail = (token, callback) => {
    findDB('token', { 'token': token }, (result) => {
        if (result.length !== 1) {
            return callback(false)
        }
        const AccountActivatePayload = {
            'email_status': true,
        }

        // Delete token from database
        deleteDB('token', { 'tokens.emailConfirmation': token }, () => {
            // Set email_status to true in User Table
            updateDB('user', AccountActivatePayload, () => {
                return callback(true)
            })
        })
    })
}

module.exports = newAccount
module.exports = confirmEmail
