// Bootscreen
require('./app/boot/bootscreen')

// Express related modules
const express = require('express')
const exphbs = require('express-handlebars')
const cookieParser = require('cookie-parser')
const RateLimit = require('express-rate-limit')

const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

// Routes for Express
const routes = {
    admin: require('./routes/admin'),
    api: require('./routes/api'),
    auth: require('./routes/auth'),
    booking: require('./routes/booking'),
    listings: require('./routes/listings'),
    esApi: require('./routes/esApi'),
    market: require('./routes/market'),
    tourguide: require('./routes/tourguide'),
    user: require('./routes/user'),
    support: require('./routes/support'),
    index: require('./routes/index'),
    chat: require('./routes/chat'),
}

// cookieParser: Secret key for signing
// Uses genkan's secret key to sign cookies
app.use(cookieParser(require('./config/genkan.json').genkan.secretKey))

// Express: Public Directory
app.use('/', express.static('public'))
app.use('/static', express.static('storage'))
app.use('/third_party', express.static('third_party'))
app.use('/usercontent', express.static('storage'))

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

// Genkan API
const genkan = require('./app/genkan/genkan')

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
    if (req.signedCookies.sid === undefined) {
        req.currentUser = false
        return next()
    }

    genkan.getUserBySession(req.signedCookies.sid, (user) => {
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

// Make all routes getCurrentUser
app.use(getCurrentUser)

// Module imports
const dateFormat = require('dateformat')

// Handlebars: Render engine
app.set('view engine', 'hbs')

// Handlebars: Environment options
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: `views/layouts`,
    helpers: {
        ifEquals(a, b, options) {
            if (a === b) {
                return options.fn(this)
            } else {
                return options.inverse(this)
            }
        },

        ifNumEquals(a, b) {
            if (parseInt(a) == parseInt(b)) {
                return true
            } else {
                return false
            }
        },

        ifInRange(value, lower, upper, options) {
            if ((lower <= parseFloat(value)) && (parseFloat(value)<= upper)) {
                return options.fn(this)
            } else {
                return options.inverse(this)
            }
        },

        ifNotEquals(a, b, options) {
            if (a !== b) {
                return options.fn(this)
            } else {
                return options.inverse(this)
            }
        },

        ifBigger(a, b, options) {
            if (a > b) {
                return options.fn(this)
            } else {
                return options.inverse(this)
            }
        },

        ifSmaller(a, b, options) {
            if (a < b) {
                return options.fn(this)
            } else {
                return options.inverse(this)
            }
        },

        haveErr: (value, options) =>{
            // Removes all null values and boolean (true if not empty, false if empty)
            return value.filter((n) => n).length != 0
        },

        isDefined: (value, options) =>{
            return typeof(value) !== 'undefined'
        },

        readArrWithReplace: (value, options) =>{
            let arr = value.split(',')
            // arr = arr.map((e)=>e.replaceAll(';!;', ','))
            arr = arr.map((e) => e.replace(new RegExp(';!;', 'g'), ','))
            // arr = arr.map((e)=>e.replace('/;!;/g', ','))
            return arr
        },

        readArr: (value, options) =>{
            return value.split(',')
        },

        splitArr_semicolon: (value, options) => {
            return value.split(';!;')
        },

        emptyArr: (value, options) =>{
            return (value.length == 0)
        },

        numToIndex: (value, options) =>{
            index = parseInt(value, 10) - 1
            return index
        },

        ifAfterToday: (value, options) =>{
            // bug: returns html without the handlebars blocks
            today = new Date()
            if (today >= value) {
                console.log(options.fn(this))
                return options.fn(this)
            } else {
                return options.inverse(this)
            }
        },

        math: (base, operator, value) => {
            if (operator == '+') {
                return parseFloat(base) + parseFloat(value)
            } else if (operator == '-') {
                return parseFloat(base) - parseFloat(value)
            } else if (operator == '/') {
                return parseFloat(base) / parseFloat(value)
            } else if (operator == '*') {
                return parseFloat(base) * parseFloat(value)
            }
        },

        dateParseISO: (value) => {
            return dateFormat(value, 'dS mmmm yyyy')
        },

        onlyTime: (value) => {
            const hours = dateFormat(value, 'HH')
            let suffix = ''
            if (parseInt(hours) < 12) {
                suffix = ' AM'
            } else if (parseInt(hours) >= 12) {
                suffix = ' PM'
            }
            const time = dateFormat(value, 'hh:MM') + suffix
            return time
        },

        timestampParseISO: (value) => {
            return dateFormat(value, 'dS mmmm yyyy, HH:MM:ss')
        },

        toNum: (value) => {
            return parseInt(value)
        },

        // Check if listing is hidden
        evalBoolean: (value) => {
            return value == 'true'
        },

        iteminWishList: (item, wishlist) => {
            if (wishlist == null || wishlist == '') {
                return false
            } else {
                wishlist = wishlist.split(';!;')
                if (wishlist.includes(item)) {
                    return true
                } else {
                    return false
                }
            }
        },

        range: (value, block) =>{
            let accum = ''
            for (let i = 1; i < value + 1; ++i) {
                accum += block.fn(i)
            }
            return accum
        },
    },
}))

// Handlebars: Views folder
app.set('views', [`views`])

// Slowdown: For Rate limiting
const limiter = new RateLimit({
    windowMs: 1*60*1000,
    max: 80,
    message: '<title>429 - Tourisit</title><p style="font-family: Arial"><b>429 — Too many requests</b><br>Please try again in a moment.<p><p style="font-family: Arial"><small>Why am I seeing this: You are sending too many requests to Tourisit.<br>Tourisit limits the number of request a user can make to prevent DDOS attacks.</small></p>',
})

app.use(limiter)

// Express: Routes
const webserver = () => {
    app.use('/id', routes.auth)

    app.use('/listing', routes.listings)

    app.use('/id', routes.auth)

    app.use('/u', routes.user)

    app.use('/bookings', loginRequired, routes.booking)

    app.use('/admin', adminAuthorisationRequired, routes.admin)

    app.use('/helpdesk', loginRequired, routes.support)

    app.use('/', routes.index)

    app.use('/tourguide', loginRequired, routes.tourguide)

    app.use('/marketplace', routes.market)

    app.use('/es-api', routes.esApi)

    app.use('/messages', routes.chat)

    // Don't put any more routes after this block, cuz they will get 404'ed
    app.get('*', (req, res) => {
        const metadata = {
            meta: {
                title: '404',
                path: false,
            },
            nav: {},
            data: {
                currentUser: req.currentUser,
            },
        }
        res.status = 404
        return res.render('404', metadata)
    })

    server.listen(5000, (err) => {
        if (err) throw log.error(err)
        console.log(`Web server listening on port 5000 | http://localhost:5000`)
    })
}

// Load SQLize models
require('./models').sequelize.sync().then((req) => {
    // System Integrity check
    // This checks the database to ensure it contains the needed objects for the system to function correctly.
    // At no point should this piece of code be disabled or commented out.
    const integrityCheck = require('./app/systemIntegrity/checks')
    integrityCheck.check().catch((err) => {
        console.error(err)
        process.exit(0)
    }).then(() => {
        // If all is well, start the webserver.
        webserver()
    })
}).catch(console.log)
