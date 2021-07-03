const express = require('express')

const router = express.Router()

// BodyParser
router.use(express.urlencoded({ extended: true }))

// Formidable: For POST data accessing
// router.use(formidable())

// Csurf: CSRF protection
const csrf = require('csurf')
router.use(csrf({ cookie: true }))

// cookieParser: Cookie schema for sessions
const SessionCookieOptions = {
    httpOnly: true,
    secure: true,
    signed: true,
    // domain: `.${config.webserver.cookieDomain}`,
    maxAge: 7890000,
    path: '/',
}

// cookieParser: Cookie schema for notifications
const NotificationCookieOptions = {
    httpOnly: true,
    secure: true,
    signed: true,
    // domain: `.${config.webserver.cookieDomain}`,
    maxAge: 5000,
    path: '/',
}


// Dependencies for authentication system
require('../app/genkan/login')
require('../app/genkan/logout')
require('../app/genkan/register')
require('../app/genkan/resetPassword')
require('../app/genkan/genkan') // This is the API

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/register', (req, res) => {
    const metadata = {
        meta: {
            title: 'Register',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
        notifs: req.signedCookies.notifs,
        csrfToken: req.csrfToken(),
    }

    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect('/?loggedin=true')
        }
        res.render('auth/register', metadata)
    })
})

router.post('/register', (req, res) => {
    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect('/?loggedin=true')
        }

        const name = req.body.username
        const email = req.body.email.toLowerCase().replace(/\s+/g, '')
        const password = req.body.password
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress

        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

        // Data validations
        if (emailRegex.test(email) === false || password.length < 8) return

        newAccount(name, email, password, ipAddress, (result) => {
            if (result === false) {
                console.log('Duplicate account')
                res.cookie('notifs', 'ERR_DUP_EMAIL', NotificationCookieOptions)
                return res.redirect('/id/signup')
            }

            console.log('Account creation OK')

            res.cookie('preData', email, NotificationCookieOptions)
            return res.redirect('/id/confirm')
        })
    })
})

router.get('/recover', (req, res) => {
    const metadata = {
        meta: {
            title: 'Recover Account',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
        notifs: req.signedCookies.notifs,
        csrfToken: req.csrfToken(),
    }

    res.render('auth/recoverAccount', metadata)
})

router.post('/recover', (req, res) => {
    const email = req.body.email.toLowerCase().replace(/\s+/g, '')

    sendResetPasswordEmail(email, () => {
        res.cookie('notifs', 'OK_EMAIL_SENT', NotificationCookieOptions)
        console.log('Recovery email sent.')
        return res.redirect('/id/recover')
    })
})

router.get('/reset', (req, res) => {
    const metadata = {
        meta: {
            title: 'Reset Password',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
        notifs: req.signedCookies.notifs,
        csrfToken: req.csrfToken(),
    }

    if (req.query.token === undefined) {
        return res.redirect('/id/recover')
    }

    return res.render('auth/changePassword', metadata)
})

router.post('/reset', (req, res) => {
    if (req.query.token === undefined) {
        return false
    }

    resetPassword(req.query.token, req.body.password, (result) => {
        if (result === false) {
            res.cookie('notifs', 'ERR_TOKEN_INVALID', NotificationCookieOptions)
            return res.redirect('/id/login')
        }

        res.cookie('notifs', 'OK_PWD_RESET', NotificationCookieOptions)
        return res.redirect('/id/login')
    })
})

router.get('/confirm', (req, res) => {
    const metadata = {
        meta: {
            title: 'Verify Email Address',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
        notifs: req.signedCookies.notifs,
        csrfToken: req.csrfToken(),
    }

    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect('/?loggedin=true')
        }

        // Check if user is wanting to do an email confirmation
        if (req.query.token !== undefined) {
            return confirmEmail(req.query.token, (result) => {
                if (result === false) {
                    return res.render('auth/confirmEmail', { notifs: 'ERR_EMAIL_TOKEN_INVALID', metadata })
                }

                return res.render('auth/confirmEmail', { notifs: 'OK_EMAIL_CONFIRMED', metadata })
            })
        }

        // If user isn't supposed to be on this page (possible directory traversal)
        if (req.signedCookies.preData === undefined) {
            return res.redirect('/id/login')
        }

        // Else give them the email confirmation page
        return res.render('auth/confirmEmail', { userEmailAddress: req.signedCookies.preData })
    })
})

router.get('/login', (req, res) => {
    const metadata = {
        meta: {
            title: 'Login',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
        notifs: req.signedCookies.notifs,
        csrfToken: req.csrfToken(),
    }

    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect('/?loggedin=true')
        }
        res.render('auth/login', metadata)
    })
})

router.post('/login', (req, res) => {
    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === true) {
            return res.redirect('/?loggedin=true')
        }
        const email = req.body.email.toLowerCase().replace(/\s+/g, '')
        const password = req.body.password
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress

        loginAccount(email, password, ipAddress, (result) => {
            if (result === false) {
                console.log('Failed to login')
                res.cookie('notifs', 'ERR_CREDS_INVALID', NotificationCookieOptions)
                return res.redirect('/id/login')
            }
            if (result === 'EMAIL_NOT_VERIFIED') {
                res.cookie('preData', email, NotificationCookieOptions)
                return res.redirect('/id/confirm')
            }

            console.log('Login OK')
            res.cookie('sid', result, SessionCookieOptions)
            return res.redirect('/?loggedin=true')
        })
    })
})

router.get('/logout', (req, res) => {
    const metadata = {
        meta: {
            title: 'Logout',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
        notifs: req.signedCookies.notifs,
        csrfToken: req.csrfToken(),
    }

    isLoggedin(req.signedCookies.sid, (result) => {
        if (result === false) {
            res.cookie('notifs', 'ERR_ALREADY_LOGGEDOUT', NotificationCookieOptions)
            return res.redirect('/id/login')
        }
        res.render('auth/logout', metadata)
    })
})

router.post('/logout', (req, res) => {
    // By default, do not sign out of all devices
    let signoutType = false

    if (req.body.logoutOf == 'ALL') {
        signoutType = true
    }

    logoutAccount(req.signedCookies.sid, signoutType, () => {
        res.clearCookie('sid', SessionCookieOptions)
        return res.redirect('/?loggedout=true')
    })
})


module.exports = router
