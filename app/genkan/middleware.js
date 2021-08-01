const genkan = require('./genkan')

// Express: Middleware
// Block all pages if not admin
const adminAuthorisationRequired = (req, res, next) => {
    genkan.isAdmin(req.signedCookies.sid, (result) => {
        if (result !== true) {
            const metadata = {
                meta: {
                    title: '403',
                    path: false,
                },
                nav: {},
                data: {
                    currentUser: req.currentUser,
                },
            }
            res.status = 403
            return res.render('403', metadata)
        }

        return next()
    })
}

// Block if not logged in
const loginRequired = (req, res, next) => {
    genkan.isLoggedin(req.signedCookies.sid, (result) => {
        if (result !== true) {
            res.status = 401
            return res.redirect(302, '/id/login?required=1')
        }

        return next()
    })
}

// Block if not logged in
const getCurrentUser = (req, res, next) => {
    let sidToValidate

    // Check whether this is a system login
    if (req.apikey === undefined) {
        // Otherwise, check whether a session id is present
        if (req.signedCookies.sid === undefined) {
            req.currentUser = false
            return next()
        }

        // If all is well, set the session id to validate
        sidToValidate = req.signedCookies.sid
    } else {
        // Same here, but for API keys
        sidToValidate = req.apikey
    }

    genkan.getUserBySession(sidToValidate, (user) => {
        if (user === null) {
            req.currentUser = false
            return next()
        }

        // Updates the last seen
        genkan.updateLastSeenByID(user.id)

        req.currentUser = user
        return next()
    })
}

module.exports = {
    adminAuthorisationRequired,
    loginRequired,
    getCurrentUser,
}
