// Load environment
const config = require('../../config/genkan.json')
const apikeys = require('../../config/apikeys.json')

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
        pass: apikeys.secret.SENDGRID_KEY,
    },
})

// Database operations
require('../db')

// Handlebars
const Handlebars = require('handlebars')

// Email Template
const fs = require('fs')
const confirmEmailSource = fs.readFileSync(`node_modules/${config.genkan.theme}/mail/confirmation.hbs`, 'utf8')
const confirmEmailTemplate = Handlebars.compile(confirmEmailSource)

newAccount = (name, email, password, ip, callback) => {
    // Check for duplicate accounts
    findDB('user', { 'email': email }, (result) => {
        // Reject if duplicate
        if (result.length !== 0) {
            return callback(false)
        }

        // SHA512 Hashing
        const hashedPasswordSHA512 = sha512({
            a: password,
            b: config.genkan.secretKey,
        })

        // Bcrypt Hashing
        const hashedPasswordSHA512Bcrypt = bcrypt.hashSync(hashedPasswordSHA512, saltRounds)

        // Generate email confirmation token
        const emailConfirmationToken = tokenGenerator()


        // Generate userId
        const userId = uuid.v1()

        const NewUserSchema = {
            'id': userId,
            'name': name,
            'email': email,
            'password': hashedPasswordSHA512Bcrypt,
            'lastseen_time': new Date(),
            'ip_address': ip,
        }

        const TokenSchema = {
            'token': emailConfirmationToken,
            'type': 'EMAIL',
            'userId': userId,
        }

        // Insert new user into database
        insertDB('user', NewUserSchema, () => {
            // Insert new email confirmation token into database
            insertDB('token', TokenSchema, (a) => {
                sendConfirmationEmail(email, emailConfirmationToken)
                return callback(true)
            })
        })
    })
}

// newAccount('John Appleseed', 'john.seedapple123@gmail.com', 'Apples#@09812', () => {})

sendConfirmationEmail = (email, token) => {
    // Compile from email template
    const data = {
        receiver: email,
        url: `https://tourisit.tanuki.works/confirm?confirmation=${token}`,
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
    findDB('token', { 'token': token, 'type': 'EMAIL' }, (result) => {
        // console.log(result[0].dataValues)
        if (result.length !== 1) {
            return callback(false)
        }
        const AccountActivatePayload = {
            'email_status': true,
        }

        // Delete token from database
        deleteDB('token', { 'token': token, 'type': 'EMAIL' }, () => {
            // Set email_status to true in User Table
            updateDB('user', { id: result[0].dataValues.userId }, AccountActivatePayload, () => {
                return callback(true)
            })
        })
    })
}

// confirmEmail('b0a64ba09f61353ed7f23a2bfb635d06d2103dc18782b63912584f280a85530689525f619527dad1b6f2ee7de88282c23ab18bf7a61fa61ab6dc9286c1dc058b', () => {
//     console.log('Confirmed')
// })

// newAccount("test", "test@tester.com", "test", ()=>{
//     console.log("Done")
// })

module.exports = newAccount
module.exports = confirmEmail
