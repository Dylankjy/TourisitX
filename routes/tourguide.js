const express = require('express')

const genkan = require('../app/genkan/genkan')

// Globals
const router = express.Router()
const { Shop, Booking, ChatRoom, ChatMessages, TourPlans } = require('../models')
const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
router.use(formidable())
const Validator = formidableValidator.Validator
const uuid = require('uuid')
const { removeNull, emptyArray, removeFromArray } = require('../app/helpers')
// Sync Loops
const syncLoop = require('sync-loop')
// Put all your routings below this line -----

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
        offset = pageSize * (pageNo - 1)
    } else {
        pageNo = 1
    }

    const userData = await genkan.getUserBySessionAsync(sid)
    Booking.findAndCountAll({
        where: {
            tgId: userData.id,
            completed: 0,
            approved: 1,
        },
        order: [['createdAt', 'ASC']],
        include: Shop,
        raw: true,
        limit: pageSize,
        offset: offset,
    })
        .then( (result) => {
            const bookCount = result.count
            const bookList = result.rows
            const lastPage = Math.ceil(bookCount / pageSize)
            const metadata = {
                meta: {
                    title: 'All Bookings',
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
        }).catch((err) => console.log)
})

router.get('/bookings/:id', (req, res) => {
    const bookID = req.params.id
    // const booking = bookingList.filter((obj) => {
    //     return obj.id == bookID
    // })[0]
    Booking.findOne({
        where: {
            bookId: bookID,
        },
        include: Shop,
        raw: true,
    }) .then(async (result) => {
        res.cookie('result', JSON.stringify(result), { maxage: 5000 })
        // const sid = req.signedCookies.sid
        // const userId = await genkan.getUserBySessionAsync(sid)

        TourPlans.findAndCountAll({
            where: {
                bookId: bookID,
            },
            raw: true,
        }) .then((tourPlanData) => {
            console.log(tourPlanData.rows)
            // Hi again, yes. I swapped this one out as well.
            // Read booking.js at line 100 for more info.
            getAllTypesOfMessagesByRoomID(result.chatId, (chatroomObject) => {
                const listOfParticipantNames = []

                // This is a hacky way to get the names of the participants in a chat room.
                syncLoop(chatroomObject.users.length, (loop) => {
                    const i = loop.iteration()

                    genkan.getUserByID(chatroomObject.users[i], (userObject) => {
                        listOfParticipantNames.push(userObject.name)
                        loop.next()
                    })
                }, () => {
                    genkan.getUserByID(result['custId'], (custData) => {
                        console.log(custData)
                        const metadata = {
                            meta: {
                                title: result['Shop.tourTitle'],
                                path: false,
                            },
                            validationErrors: req.cookies.validationErrors,
                            data: {
                                currentUser: req.currentUser,
                                book: result,
                                timeline: chatroomObject.msg,
                                participants: listOfParticipantNames,
                                cust: custData,
                            },
                            nav: {
                                sidebarActive: 'bookings',
                            },
                            layout: 'main',
                            // tourPlans is a placeholder used for testing until the customisation features are in
                            tourPlans: tourPlanData.rows,

                        }
                        return res.render('tourguide/myJob', metadata)
                    })
                })
            })
        })
    }).catch((err) => console.log)
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

    // // Evaluate the files and fields data separately
    const validationErrors = removeNull([
        tourDateResult,
        startTimeResult,
        endTimeResult,
        tourPaxResult,
        tourPriceResult,
    ])

    console.log('tourDateResult is '+ tourDateResult)
    console.log('validationErrors is '+ validationErrors)
    if (!emptyArray(validationErrors)) {
        console.log('ooga valid error')
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/tourguide/bookings/${bookId}`)
    } else {
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')

        console.log(req.fields)
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
        // process itinerary
        // calculate tour duration
        // process index
        Booking.findOne({
            where: {
                bookId: bookId,
            },
            raw: true,
        }).then((bookData) => {
            // update booking's process step and details
            Booking.update(
                {
                    processStep: 2,
                    tourStart: tourStart,
                    tourEnd: tourEnd,
                    bookPax: req.fields.tourPax,
                    bookBaseprice: req.fields.tourPrice,
                    revisions: bookData.revisions - 1,
                },
                {
                    where: { bookId: bookId },
                },
            )
            TourPlans.findAndCountAll({
                where: {
                    bookId: bookId,
                },
            }).then((tourPlanResult) => {
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
                        tourItinerary: '',
                        accepted: 0,
                    },
                ).then((data) => {
                    addMessage(bookData.chatId, 'SYSTEM', planIndex, 'TOURPLAN', () => {
                        res.redirect(`/tourguide/bookings/${bookId}`)
                    })
                })
            }).catch((err) =>{
                console.log(err)
            })
        }) .catch((err) =>{
            console.log(err)
        })
    }
})


router.get('/payments', (req, res) => {
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
            transactions: { exampleTransaction, exampleTransaction2 },
        },
    }
    return res.render('tourguide/dashboard/payments', metadata)
})

module.exports = router
