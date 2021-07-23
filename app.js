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

// Genkan API & Middleware
const genkan = require('./app/genkan/genkan')
const { getCurrentUser, loginRequired, adminAuthorisationRequired } = require('./app/genkan/middleware')

// Make all routes getCurrentUser
app.use(getCurrentUser)

// Module imports
const dateFormat = require('dateformat')
const { addMessage, getAllTypesOfMessagesByRoomID, startSocketClient } = require('./app/chat/chat')
const sanitizeHtml = require('sanitize-html')
const ta = require('time-ago')

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

        parseTimeAgo: (value) => {
            if ((new Date() - value) / 1000 < 120) {
                return 'Just now'
            }
            return ta.ago(value)
        },

        toNum: (value) => {
            return parseInt(value)
        },

        // Check if listing is hidden
        evalBoolean: (value) => {
            return value == 'true'
        },

        // Give an opposing value.
        oppositeValue: (compareValue, withThisList) => {
            if (withThisList[0] === compareValue) {
                return withThisList[1]
            } else if (withThisList[1] === compareValue) {
                return withThisList[0]
            }
            return 'Unknown User'
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

        bookActivityName: (msg, custName, tgName, options) =>{
            let newMsg = msg.replace('<customer>', custName)
            newMsg = newMsg.replace('<tourguide>', tgName)
            return newMsg
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
        if (err) {
            console.log(`\x1b[1m\x1b[2m[WEBSERVER] - \x1b[0m\x1b[1m\x1b[31m\x1b[5mFAILED\x1b[0m\x1b[31m: Unable to bind to port 5000. Could there possibly be another instance alive?\x1b[0m`)
        }
        console.log(`\x1b[1m\x1b[2m[WEBSERVER] - \x1b[1m\x1b[34mOK\x1b[0m: Webserver binded on port 5000 | http://127.0.0.1:5000\x1b[0m`)
        startSocketClient()
    })
}

// I'm putting this here because apparent for the love of everyone. THERE'S NO F***ing SOLUTION ON STACKOVERFLOW THAT WORKS.
// Thanks for wasting 3 hours.
io.on('connection', (socket) => {
    // When a user sends a message in a room
    socket.on('msgSend', (data) => {
        if (data.msg === '') {
            return
        }
        // require('./config/genkan.json').genkan.secretKey
        const reqCookies = require('cookie').parse(socket.handshake.headers.cookie)

        const decryptedSID = cookieParser.signedCookie(reqCookies.sid, require('./config/genkan.json').genkan.secretKey)

        genkan.isLoggedin(decryptedSID, (result) => {
            if (result !== true) {
                return io.emit('reloginRequired')
            }

            // The reason why this is getAllTypesOfMessagesByRoomID is because getUwUMessagesByRoomID it only gets messages that are not of booking type.
            getAllTypesOfMessagesByRoomID(data.roomId, async (chatRoomObject) => {
            // Checks whether chatroom exists and if the user requesting it has permissions to view it.
                if (chatRoomObject === null || chatRoomObject.users.includes(data.senderId) === false) {
                    return false
                }

                genkan.getUserByID(data.senderId, (userObject) => {
                    addMessage(data.roomId, data.senderId, sanitizeHtml(data.msg), 'SENT', () => {
                        return io.to(data.roomId).emit('msgReceive', { msg: sanitizeHtml(data.msg), roomId: data.roomId, senderId: data.senderId, senderName: userObject.name, pendingCount: data.pendingCount })
                    })
                })
            })
        })
    })

    // Handles room joining
    socket.on('room', (room) => {
        return socket.join(room)
    })
})

// Load SQLize models
require('./models').sequelize.sync().then((req) => {
    // System Integrity check
    // This checks the database to ensure it contains the needed objects for the system to function correctly.
    // At no point should this piece of code be disabled or commented out.
    const integrityCheck = require('./app/systemIntegrity/checks')
    integrityCheck.check().catch((err) => {
        console.log(`\x1b[1m\x1b[2m[SYSTEMIC] - \x1b[0m\x1b[1m\x1b[31m\x1b[5mFAILED\x1b[0m\x1b[31m: System checks not satisifed. Halting application.\x1b[0m`)
        console.error(err)
        process.exit(1)
    }).then(() => {
        // If all is well, start the webserver.
        webserver()
    })
}).catch(console.log)
