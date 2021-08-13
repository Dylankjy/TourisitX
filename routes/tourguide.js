const express = require('express')

const genkan = require('../app/genkan/genkan')

// Globals
const router = express.Router()
const { Shop, Booking, ChatRoom, ChatMessages, TourPlans, Review, User } = require('../models')
const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
router.use(formidable())
const Validator = formidableValidator.Validator
const uuid = require('uuid')
const { removeNull, emptyArray, removeFromArray } = require('../app/helpers')
// Sync Loops
const syncLoop = require('sync-loop')
const { UserAgent } = require('express-useragent')
// Put all your routings below this line -----
const config = require('../config/apikeys.json')


const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const exampleTransaction = {
    date_paid: new Date('2011-10-05T14:48:00.000Z'),
    tour_name: 'Sex on the beach',
    cust_id: 'Takahashi Taro',
    tg_id: 'Nakamoto Yui',
    earnings: '1000',
    status: true,
}

const exampleTransaction2 = {
    date_paid: new Date('2011-10-05T14:48:00.000Z'),
    tour_name: 'City Dwelling',
    cust_id: 'Ri Ui',
    tg_id: 'Nakamoto Yui',
    earnings: '1000',
    status: false,
}

// router.get('/', (req, res) => { ... }
router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Your Desk',
            path: false,
        },
        nav: {
            sidebarActive: 'desk',
        },
        data: {
            currentUser: req.currentUser,
        },
        layout: 'tourguide',
    }
    return res.render('tourguide/dashboard/dashboard', metadata)
})

router.get('/manage/listings', async (req, res) => {
    const sid = req.signedCookies.sid
    if (sid == null) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
    // Redirect to login page
        return res.send('Pls login')
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    Shop.findAll({
        where: {
            // Set to empty now, but it should be replaced with the userID when authentication library is out
            userId: userData.id,
            hidden: 'false',
        },
        order: [['createdAt', 'ASC']],
    })
        .then((items) => {
            const itemsArr = items.map((x) => x['dataValues']).reverse()
            const metadata = {
                meta: {
                    title: 'Manage listings',
                    path: false,
                },
                nav: {
                    sidebarActive: 'listings',
                },
                layout: 'tourguide',
                listing: itemsArr,
            }
            return res.render('tourguide/dashboard/listings', metadata)
        })
        .catch((err) => {
            console.log
        })
})

router.get('/manage/listings/archived', async (req, res) => {
    const sid = req.signedCookies.sid
    if (sid == null) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
    // Redirect to login page
        return res.send('Pls login')
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    Shop.findAll({
        where: {
            // Set to empty now, but it should be replaced with the userID when authentication library is out
            userId: userData.id,
            hidden: 'true',
        },
        order: [['createdAt', 'ASC']],
    })
        .then((items) => {
            const itemsArr = items.map((x) => x['dataValues']).reverse()
            const metadata = {
                meta: {
                    title: 'Manage listings',
                    path: false,
                },
                nav: {
                    sidebarActive: 'listings',
                    sidebarSubActive: 'listingsArchived',
                },
                layout: 'tourguide',
                listing: itemsArr,
            }
            return res.render('tourguide/dashboard/archived', metadata)
        })
        .catch((err) => {
            console.log
        })
})

router.get('/bookings', async (req, res) => {
    const sid = req.signedCookies.sid
    let pageNo = req.query.page
    const pageSize = 5
    let offset = 0
    if (pageNo) {
        pageNo = parseInt(pageNo)
        if (pageNo <= 0) {
            pageNo = 1
        }
        offset = pageSize * (pageNo - 1)
    } else {
        pageNo = 1
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    bookings = await Booking.findAndCountAll({
        where: {
            tgId: userData.id,
            approved: 1,
            processStep: ['1', '2', '3', '4'],
        },
        attributes: ['bookId', 'processStep', 'completed', 'tourStart', 'orderDatetime', 'custId'],
        order: [['updatedAt', 'ASC']],
        include: { model: Shop,
            attributes: ['tourTitle'] },
        raw: true,
        limit: pageSize,
        offset: offset,
    })
    let bookCount = 0
    let bookList
    let lastPage = 1
    if (bookings.rows.length > 0) {
        bookCount = bookings.count
        bookList = bookings.rows
        lastPage = Math.ceil(bookCount / pageSize)
    }

    const metadata = {
        meta: {
            title: 'All Active Bookings',
            pageNo: pageNo,
            count: bookCount,
            lastPage: lastPage,
        },
        data: {
            currentUser: req.currentUser,
            bookList: bookList,
        },
        nav: {
            sidebarActive: 'bookings',
        },
        layout: 'tourguide',
    }
    return res.render('tourguide/dashboard/bookings', metadata)
})

router.get('/bookings/completed', async (req, res) => {
    const sid = req.signedCookies.sid
    let pageNo = req.query.page
    const pageSize = 5
    let offset = 0
    if (pageNo) {
        pageNo = parseInt(pageNo)
        if (pageNo <= 0) {
            pageNo = 1
        }
        offset = pageSize * (pageNo - 1)
    } else {
        pageNo = 1
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    bookings = await Booking.findAndCountAll({
        where: {
            tgId: userData.id,
            approved: 1,
            processStep: '5',
            completed: 1,
        },
        // order: [['updatedAt', 'ASC']],
        attributes: ['bookId', 'processStep', 'completed', 'tourStart', 'orderDatetime', 'custId'],
        include: [
            { model: Shop,
                attributes: ['tourTitle'] },
            { model: Review,
                required: false,
                attributes: ['id'],
                where: { reviewerId: userData.id } }],
        raw: true,
        limit: pageSize,
        offset: offset,
    })

    let bookCount = 0
    let bookList
    let lastPage = 1
    if (bookings.rows.length > 0) {
        bookCount = bookings.count
        bookList = bookings.rows
        lastPage = Math.ceil(bookCount / pageSize)
    }
    const metadata = {
        meta: {
            title: 'All Completed Bookings',
            pageNo: pageNo,
            count: bookCount,
            lastPage: lastPage,
        },
        data: {
            currentUser: req.currentUser,
            bookList: bookList,
        },
        nav: {
            sidebarActive: 'bookings',
            sidebarSubActive: 'bookingsCompleted',
        },
        layout: 'tourguide',
    }
    return res.render('tourguide/dashboard/bookingsCompleted', metadata)
})

router.get('/bookings/:id', async (req, res) => {
    const bookID = req.params.id

    bookData = await Booking.findOne({
        where: {
            bookId: bookID,
        },
        include: Shop,
        raw: true,
    })
    if (bookData == undefined) {
        const metadata = {
            meta: {
                title: '404',
            },
            data: {
                currentUser: req.currentUser,
            },
        }
        res.status = 404
        return res.render('404', metadata)
    }

    if (bookData.tgId != req.currentUser.id) {
        res.redirect(`/tourguide/bookings`)
    }
    res.cookie('storedValues', JSON.stringify(bookData), { maxage: 5000 })
    // const sid = req.signedCookies.sid
    // const userId = await genkan.getUserBySessionAsync(sid)

    tourPlanData = await TourPlans.findAndCountAll({
        where: {
            bookId: bookID,
        },
        raw: true,
        order: [
            ['createdAt', 'ASC'],
        ],
    })

    const reviews = {
        CUST: null,
        TOUR: null,
    }
    reviews['CUST'] = await Review.findOne({
        where: {
            bookId: bookID,
            subjectId: bookData['custId'],
        },
        raw: true,
    })
    reviews['TOUR'] = await Review.findOne({
        where: {
            bookId: bookID,
            subjectId: bookData['tgId'],
        },
        raw: true,
    })

    getAllTypesOfMessagesByRoomID(bookData.chatId, (chatroomObject) => {
        const listOfParticipantNames = []

        // This is a hacky way to get the names of the participants in a chat room.
        syncLoop(chatroomObject.users.length, (loop) => {
            const i = loop.iteration()

            genkan.getUserByID(chatroomObject.users[i], (userObject) => {
                listOfParticipantNames.push(userObject.name)
                loop.next()
            })
        }, () => {
            genkan.getUserByID(bookData['custId'], (custData) => {
                // Calculating price stuff
                const chargesArr = bookData['bookCharges'].split(',')
                const revisionFee = chargesArr[0]
                let priceToPay = parseInt(bookData['bookBaseprice'])
                let extraRevFees = 0

                // Any extra revisions
                if (bookData['custom'] > 0 && bookData['revisions'] < 0) {
                    const noOfRevisions = Math.abs(bookData['revisions'])
                    extraRevFees = noOfRevisions * revisionFee
                    priceToPay += extraRevFees
                }
                extraRevFees = extraRevFees.toFixed(2)
                serviceFee = priceToPay * 0.15
                const metadata = {
                    meta: {
                        title: bookData['Shop.tourTitle'],
                        path: false,
                    },
                    validationErrors: req.cookies.validationErrors,
                    data: {
                        currentUser: req.currentUser,
                        book: bookData,
                        timeline: chatroomObject.msg,
                        participants: listOfParticipantNames,
                        reviews: reviews,
                        cust: custData,
                        charges: {
                            bookCharges: chargesArr,
                            customFee: revisionFee,
                            priceToPay: priceToPay,
                            extraRevFees: extraRevFees,
                            serviceFee: serviceFee,
                        },
                    },
                    tourPlans: tourPlanData.rows,
                    nav: {
                        sidebarActive: 'bookings',
                    },
                    layout: 'main',

                }
                return res.render('tourguide/myJob', metadata)
            })
        })
    })
})

router.post('/bookings/:id', async (req, res) => {
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })
    const bookId = req.params.id
    const v = new Validator(req.fields)

    // Doing this way so its cleaner. Can also directly call these into the removeNull() array
    const tourDateResult = v
        .Initialize({
            name: 'tourDate',
            errorMessage: 'Please select a tour date.',
        })
        .exists()
        .getResult()

    const startTimeResult = v
        .Initialize({
            name: 'startTime',
            errorMessage: 'Please select a tour start time.',
        })
        .exists()
        .getResult()

    const endTimeResult = v
        .Initialize({
            name: 'endTime',
            errorMessage: 'Please select a tour end time.',
        })
        .exists()
        .getResult()

    const tourPaxResult = v
        .Initialize({
            name: 'tourPax',
            errorMessage: 'Please select number of participants.',
        })
        .exists()
        .getResult()

    const tourPriceResult = v
        .Initialize({
            name: 'tourPrice',
            errorMessage: 'Please enter a tour price.',
        })
        .exists()
        .getResult()

    const itineraryResult = v
        .Initialize({
            name: 'finalItinerary',
            errorMessage: 'Please create a Tour Itinerary',
        })
        .exists()
        .getResult()

    // // Evaluate the files and fields data separately
    const validationErrors = removeNull([
        tourDateResult,
        startTimeResult,
        endTimeResult,
        tourPaxResult,
        tourPriceResult,
        itineraryResult,
    ])

    if (!emptyArray(validationErrors)) {
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/tourguide/bookings/${bookId}`)
    } else {
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')

        // process dates
        const tourDate = req.fields.tourDate
        const tourDateArr = tourDate.split('-')
        formatDateTime = (timeType) => {
            arr = timeType.split(':')
            if (arr[1].slice(-2) == 'PM' && parseInt(arr[0])<12) {
                arr[0] = parseInt(arr[0]) + 12
            } else if (arr[1].slice(-2) == 'AM' && parseInt(arr[0])==12) {
                arr[0] = parseInt(arr[0]) -12
            }
            if (arr[0].toString().length == 1) {
                arr[0] = '0' + arr[0]
            }
            const newDate = new Date(parseInt(tourDateArr[0]), parseInt(tourDateArr[1])-1, parseInt(tourDateArr[2]), parseInt(arr[0]), parseInt(arr[1]))
            return newDate
        }
        const tourStart = formatDateTime(req.fields.startTime)
        const tourEnd = formatDateTime(req.fields.endTime)

        const bookData = await Booking.findOne({
            where: {
                bookId: bookId,
            },
            raw: true,
        })

        // update booking's process step and details
        Booking.update(
            {
                processStep: 2,
                tourStart: tourStart,
                tourEnd: tourEnd,
                bookPax: req.fields.tourPax,
                bookBaseprice: req.fields.tourPrice,
                revisions: bookData.revisions - 1,
                addInfo: req.fields.addInfo,
                bookItinerary: req.fields.finalItinerary,
            },
            {
                where: { bookId: bookId },
            },
        )

        const tourPlanResult = await TourPlans.findAndCountAll({
            where: {
                bookId: bookId,
            },
        })

        const planIndex = tourPlanResult.count + 1
        const genId = uuid.v1()
        TourPlans.create(
            {
                planId: genId,
                bookId: bookId,
                index: planIndex,
                tourStart: tourStart,
                tourEnd: tourEnd,
                tourPax: req.fields.tourPax,
                tourPrice: req.fields.tourPrice,
                tourItinerary: req.fields.finalItinerary,
                accepted: 0,
            },
        ).then((data) => {
            addMessage(bookData.chatId, 'SYSTEM', planIndex, 'TOURPLAN', () => {
                res.redirect(`/tourguide/bookings/${bookId}`)
            })
        })
    }
})


router.get('/payments', async (req, res) => {
    const accId = req.currentUser.stripe_account_id
    stripe.transfers.list({
        destination: accId,
    }).then(async (transfers)=> {
        // View all transfers to this account
        const history = transfers['data']
        // Get a stripe link to this account
        const accLink = await stripe.accounts.createLoginLink(accId)

        const metadata = {
            meta: {
                title: 'Payments',
                path: false,
            },
            nav: {
                sidebarActive: 'payments',
            },
            layout: 'tourguide',
            data: {
                'history': history,
                'accLink': accLink,
            },
        }
        return res.render('tourguide/dashboard/payments', metadata)
    }).catch((err)=>{
        console.log(err)
        const metadata = {
            meta: {
                title: 'Payments',
                path: false,
            },
            nav: {
                sidebarActive: 'payments',
            },
            layout: 'tourguide',
            data: {
                'history': [],
                'accLink': '',
            },
        }
        return res.render('tourguide/dashboard/payments', metadata)
    })
})

module.exports = router
