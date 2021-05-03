// Module imports
// <insert here>

// Express related modules
const express = require('express')
const exphbs = require('express-handlebars')
const cookieParser = require('cookie-parser')
const formidable = require('express-formidable')
const slowDown = require('express-slow-down')
const { check, validationResult } = require('express-validator')
const expressSession = require('express-session')
const axios = require('axios')
const bodyParser = require('body-parser')

// Routes for Express
const routes = {
    admin: require('./routes/admin'),
    api: require('./routes/api'),
    auth: require('./routes/auth'),
    booking: require('./routes/booking'),
    listings: require('./routes/listings'),
    market: require('./routes/market'),
    tourguide: require('./routes/tourguide'),
    user: require('./routes/user'),
}

const app = express()

// Express Additional Options
// Express: Public Directory
app.use('/', express.static('public'))
app.use('/third_party', express.static('third_party'))

// Handlebars: Render engine
app.set('view engine', 'hbs')

// Handlebars: Environment options
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: `views/layouts`,
}))

// Handlebars: Views folder
app.set('views', [`views`])

// cookieParser: Secret key for signing
app.use(cookieParser("Please change this when in production use"))

// cookieParser: Cookie schema
// const CookieOptions = {
//     httpOnly: true,
//     secure: true,
//     signed: true,
//     domain: `.${config.webserver.domain}`,
// }

// app.use(bodyParser.urlencoded({extended: true}))
// app.use(bodyParser.json())
// app.use(bodyParser.raw())

// Formidable: For POST data accessing
app.use(formidable())

// Express-validator: For validating POST data


// Slowdown: For Rate limiting
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per 15 minutes, then...
    delayMs: 500, // begin adding 500ms of delay per request above 100:
})
// app.use(speedLimiter)

// Express: Routes
const webserver = () => {
    // Define all the router stuff here
    app.use('/', routes.market)

    app.use('/shop', routes.market)

    app.use('/listing', routes.listings)

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
        res.render('404', metadata)
    })

    app.listen(5000, (err) => {
        if (err) throw log.error(err)
        console.log(`Web server listening on port 5000 | http://localhost:5000`)
    })
}


webserver()
