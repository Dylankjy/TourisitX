const express = require('express')

const router = express.Router()

// BodyParser
router.use(express.urlencoded({ extended: true }))

// Formidable: For POST data accessing
// router.use(formidable())

// Csurf: CSRF protection
const csrf = require('csurf')
router.use(csrf({ cookie: true }))

// Dependencies for authentication system
require('../app/genkan/login')
require('../app/genkan/logout')
require('../app/genkan/register')
require('../app/genkan/resetPassword')
require('../app/genkan/genkan') // This is the API

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/register', (req, res) => {
    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect(config.genkan.redirect.afterLogin)
        }
        res.render('auth/register', { notifs: req.signedCookies.notifs, csrfToken: req.csrfToken() })
    })
})

router.post('/register', (req, res) => {
    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect(config.genkan.redirect.afterLogin)
        }
        const email = req.body.email.toLowerCase().replace(/\s+/g, '')
        const password = req.body.password

        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

        // Data validations
        if (emailRegex.test(email) === false || password.length < 8) return

        newAccount(email, password, (result) => {
            if (result === false) {
                console.log('Duplicate account')
                res.cookie('notifs', 'ERR_DUP_EMAIL', NotificationCookieOptions)
                return res.redirect('/signup')
            }

            console.log('Account creation OK')

            res.cookie('preData', email, NotificationCookieOptions)
            return res.redirect('/confirm')
        })
    })
})

router.get('/recover', (req, res) => {
    res.render('auth/recoverAccount', { notifs: req.signedCookies.notifs, csrfToken: req.csrfToken() })
})

router.post('/recover', (req, res) => {
    const email = req.body.email.toLowerCase().replace(/\s+/g, '')

    sendResetPasswordEmail(email, () => {
        res.cookie('notifs', 'OK_EMAIL_SENT', NotificationCookieOptions)
        console.log('Recovery email sent.')
        return res.redirect('/recover')
    })
})

router.get('/reset', (req, res) => {
    if (req.query.token === undefined) {
        return res.redirect('/recover')
    }

    return res.render('auth/changePassword', { csrfToken: req.csrfToken() })
})

router.post('/reset', (req, res) => {
    if (req.query.token === undefined) {
        return false
    }

    resetPassword(req.query.token, req.body.password, (result) => {
        if (result === false) {
            res.cookie('notifs', 'ERR_TOKEN_INVALID', NotificationCookieOptions)
            return res.redirect('/login')
        }

        res.cookie('notifs', 'OK_PWD_RESET', NotificationCookieOptions)
        return res.redirect('/login')
    })
})

router.get('/confirm', (req, res) => {
    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect(config.genkan.redirect.afterLogin)
        }
        // If user isn't supposed to be on this page (possible directory traversal)
        if (req.signedCookies.preData === undefined) {
            return res.redirect('/login')
        }

        // Check if user is wanting to do an email confirmation
        if (req.query.token !== undefined) {
            confirmEmail(req.query.token, (result) => {
                if (result === false) {
                    return res.render('auth/confirmEmail', { notifs: 'ERR_EMAIL_TOKEN_INVALID' })
                }

                return res.render('auth/confirmEmail', { notifs: 'OK_EMAIL_CONFIRMED', csrfToken: req.csrfToken() })
            })
        }

        // Else give them the email confirmation page
        return res.render('auth/confirmEmail', { userEmailAddress: req.signedCookies.preData })
    })
})

router.get('/login', (req, res) => {
    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect(config.genkan.redirect.afterLogin)
        }
        res.render('auth/login', { notifs: req.signedCookies.notifs, csrfToken: req.csrfToken() })
    })
})

router.post('/login', (req, res) => {
    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect(config.genkan.redirect.afterLogin)
        }
        const email = req.body.email.toLowerCase().replace(/\s+/g, '')
        const password = req.body.password

        loginAccount(email, password, (result) => {
            if (result === false) {
                console.log('Failed to login')
                res.cookie('notifs', 'ERR_CREDS_INVALID', NotificationCookieOptions)
                return res.redirect('/login')
            }

            console.log('Login OK')
            res.cookie('sid', result, SessionCookieOptions)
            return res.redirect(config.genkan.redirect.afterLogin)
        })
    })
})

router.get('/logout', (req, res) => {
    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === false) {
            res.cookie('notifs', 'ERR_ALREADY_LOGGEDOUT', NotificationCookieOptions)
            return res.redirect('/login')
        }
        res.render('auth/logout', { csrfToken: req.csrfToken() })
    })
})

router.post('/logout', (req, res) => {
    // By default, do not sign out of all devices
    signoutType = false

    if (req.body.logoutOf == 'ALL') {
        signoutType = true
    }

    logoutAccount(req.signedCookies.sid, signoutType, () => {
        res.clearCookie('sid', SessionCookieOptions)
        return res.redirect(config.genkan.redirect.afterSignout)
    })
})


module.exports = router
