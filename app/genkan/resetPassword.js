// Load environment
const config = require('../../config/genkan.json')

// UUID & Hashing
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
// const fs = require('fs')
// const pwdResetEmailSource = fs.readFileSync(`node_modules/${theme}/mail/pwdreset.hbs`, 'utf8')
// const pwdResetEmailTemplate = Handlebars.compile(pwdResetEmailSource)

sendResetPasswordEmail = (email, callback) => {
    findDB('user', { 'email': email }, (result) => {
        if (result.length !== 1) {
            return callback(false)
        }

        const token = tokenGenerator()

        const SetTokenPayload = {
            'token': token,
            'type': 'PASSWD',
        }

        insertDB('token', SetTokenPayload, () => {
            // Compile from email template
            // TODO: Renable this when emails are working.
            // const data = {
            //     receiver: email,
            //     url: `https://${config.webserver.genkanDomain}/reset?token=${token}`,
            // }
            // const message = pwdResetEmailTemplate(data)

            // // send email
            // transporter.sendMail({
            //     from: config.smtp.mailFromAddress,
            //     to: email,
            //     subject: config.smtp.customisation.resetPassword.subject,
            //     html: message,
            // })

            return callback(true)
        })
    })
}

resetPassword = (resetPasswordToken, newPassword, callback) => {
    findDB('token', { token: resetPasswordToken, type: 'PASSWD' }, (result) => {
        if (result.length !== 1) {
            return callback(false)
        }

        // SHA512 Hashing
        const hashedPasswordSHA512 = sha512({
            a: newPassword,
            b: config.genkan.secretKey,
        })

        // Bcrypt Hashing
        const hashedPasswordSHA512Bcrypt = bcrypt.hashSync(hashedPasswordSHA512, saltRounds)

        const SetPasswordPayload = {
            'password': hashedPasswordSHA512Bcrypt,
        }

        deleteDB('token', { token: resetPasswordToken })

        updateDB('user', { 'id': result.userId }, SetPasswordPayload, () => {
            callback(true)
        })
    })
}

module.exports = resetPassword
