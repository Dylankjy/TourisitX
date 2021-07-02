// System Integrity check
// This checks the database to ensure it contains the needed objects for the system to function correctly.
// At no point should this piece of code be disabled or commented out.
const integrityCheck = require('./app/systemIntegrity/checks')
integrityCheck.check().catch((err) => {
    console.error(err)
    process.exit(0)
})


// Module imports
const dateFormat = require('dateformat')

// Express related modules
const express = require('express')
const exphbs = require('express-handlebars')
const cookieParser = require('cookie-parser')
// const formidable = require('express-formidable')
const RateLimit = require('express-rate-limit')

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

const app = express()
// Socket.io Injection
const server = require('http').Server(app)
const io = require('socket.io')(server)
app.set('io', io)

// cookieParser: Secret key for signing
// Uses genkan's secret key to sign cookies
app.use(cookieParser(require('./config/genkan.json').genkan.secretKey))

// Express Additional Options
// Express: Public Directory

// Need this in order to render the css and images
app.use('/', express.static('public'))
app.use('/static', express.static('storage'))
app.use('/third_party', express.static('third_party'))
app.use('/usercontent', express.static('storage'))

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

        haveErr: (value, options) =>{
            // Removes all null values and boolean (true if not empty, false if empty)
            return value.filter((n) => n).length != 0
        },

        isDefined: (value, options) =>{
            return typeof(value) !== 'undefined'
        },

        readArrWithReplace: (value, options) =>{
            let arr = value.split(',')
            arr = arr.map((e)=>e.replaceAll(';!;', ','))
            // arr = arr.map((e)=>e.replace(';!;', ','))
            return arr
        },

        readArr: (value, options) =>{
            return value.split(',')
        },

        emptyArr: (value, options) =>{
            return (value.length == 0)
        },

        timestampParseISO: (value) => {
            return dateFormat(value, 'dS mmmm yyyy, HH:MM:ss')
        },

        // Check if listing is hidden
        evalBoolean: (value) => {
            return value == 'true'
        },

        iteminWishList: (item, wishlist) => {
            if (wishlist == null || wishlist == '') {
                return false
            }

            wishlist = wishlist.split(';!;')
            if (wishlist.includes(item)) {
                return true
            } else {
                return false
            }
        },
    },
}))

// Handlebars: Views folder
app.set('views', [`views`])

// Formidable: For POST data accessing
// THIS IS DISABLED AS IT INTERFERES WITH POST PROCESSING FOR GENKAN
// IF YOU REQUIRE THIS MODULE, PLEASE INCLUDE IT INSIDE YOUR ROUTING FILES
// -- Dylan UwU
// app.use(formidable())

// Slowdown: For Rate limiting
const limiter = new RateLimit({
    windowMs: 1*60*1000,
    max: 60,
})

app.use(limiter)

// Express: Routes
const webserver = () => {
    app.use('/id', routes.auth)

    // app.use('/shop', routes.market)

    app.use('/listing', routes.listings)

    app.use('/id', routes.auth)

    app.use('/u', routes.user)

    app.use('/u', routes.chat)

    app.use('/bookings', routes.booking)

    app.use('/admin', routes.admin)

    app.use('/', routes.support)

    app.use('/', routes.index)

    app.use('/tourguide', routes.tourguide)

    app.use('/marketplace', routes.market)

    app.use('/es-api', routes.esApi)

    // Don't put any more routes after this block, cuz they will get 404'ed
    app.get('*', (req, res) => {
        const metadata = {
            meta: {
                title: '404',
                path: false,
            },
            nav: {},
        }
        res.status = 404
        return res.render('404', metadata)
    })

    server.listen(5000, (err) => {
        if (err) throw log.error(err)
        console.log(`Web server listening on port 5000 | http://localhost:5000`)
    })
}

require('./models').sequelize.sync().then((req) => {
    webserver()
}).catch(console.log)
