const express = require('express')

const genkan = require('../app/genkan/genkan')

// Globals
const router = express.Router()
const { Shop, Booking, ChatRoom, ChatMessages, TourPlans } = require('../models')

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
        include: Shop, TourPlans,
        raw: true,
    }) .then(async (result) => {
        res.cookie('result', JSON.stringify(result), { maxAge: 5000 })
        // const sid = req.signedCookies.sid
        // const userId = await genkan.getUserBySessionAsync(sid)

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
                const metadata = {
                    meta: {
                        title: result['Shop.tourTitle'],
                        path: false,
                    },
                    data: {
                        currentUser: req.currentUser,
                        book: result,
                        timeline: chatroomObject.msg,
                        participants: listOfParticipantNames,
                    },
                    nav: {
                        sidebarActive: 'bookings',
                    },
                    layout: 'main',
                    // tourPlans is a placeholder used for testing until the customisation features are in
                    tourPlans: [
                        {
                            planId: '00000000-0000-0000-0000-000000000000',
                            bookId: '00000000-0000-0000-0000-000000000000',
                            index: 0,
                            tourStart: new Date().toISOString(),
                            tourEnd: new Date().toISOString(),
                            tourPax: '5',
                            tourPrice: '300',
                            tourItinerary: 'Go to the chopper at bshan an eat some duck rice,Ride to outskirts of SG e',
                            accepted: '-1',
                        },
                    ],

                }
                return res.render('tourguide/myJob', metadata)
            })
        })
    }).catch((err) => console.log)
})

router.post('/bookings/:id', async (req, res) => {
    console.log(req.fields)
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })
    const bookID = req.params.id
    const sid = req.signedCookies.sid

    const userData = await genkan.getUserBySessionAsync(sid)
    Booking.findOne({
        where: {
            bookId: bookID,
        },
        include: Shop, TourPlans,
        raw: true,
    })
        .then(async (result) => {
            console.log(result)
            // const listing = await items[0]['dataValues']

            const v = new Validator(req.fields)

            const tourDateResult = v
                .Initialize({
                    name: 'tourDate',
                    errorMessage: 'Please select a tour date.',
                })
                .exists()
                .getResult()

            const tourTimeResult = v
                .Initialize({
                    name: 'tourTime',
                    errorMessage: 'Please select a tour time.',
                })
                .exists()
                .getResult()

            const bookPaxResult = v
                .Initialize({
                    name: 'tourPax',
                    errorMessage: 'Please select number of participants.',
                })
                .exists()
                .getResult()

            const bookTOCResult = v
                .Initialize({
                    name: 'bookTOC',
                    errorMessage: 'Please agree to the Terms & Conditions before booking a tour.',
                })
                .exists()
                .getResult()

            // // Evaluate the files and fields data separately
            const validationErrors = removeNull([
                tourDateResult,
                tourTimeResult,
                bookPaxResult,
                bookTOCResult,
            ])

            // If there are errors, re-render the create listing page with the valid error messages
            if (!emptyArray(validationErrors)) {
                res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
                res.redirect(`/listing/${tourID}/purchase`)
            } else {
                // If successful
                // Remove cookies for stored form values + validation errors
                res.clearCookie('validationErrors')
                res.clearCookie('storedValues')
                const genId = uuid.v4()

                const rawTourDate = req.fields.tourDate
                const darr = rawTourDate.split('/')

                const rawTourTime = req.fields.tourTime
                const timeArr = rawTourTime.split(' - ')
                const startTimeArr = timeArr[0].split(':')
                const endTimeArr = timeArr[1].split(':')
                formatTime = (arr) => {
                    if (arr[1].slice(-2) == 'PM' && parseInt(arr[0])<12) {
                        arr[0] = parseInt(arr[0]) + 12
                    } else if (arr[1].slice(-2) == 'AM' && parseInt(arr[0])==12) {
                        arr[0] = parseInt(arr[0]) -12
                    }
                    arr[1] = arr[1].slice(0, -3)
                    if (arr[0].toString().length == 1) {
                        arr[0] = '0' + arr[0]
                    }
                }
                formatTime(startTimeArr)
                formatTime(endTimeArr)
                const startTour = new Date(parseInt(darr[2]), parseInt(darr[1])-1, parseInt(darr[0]), parseInt(startTimeArr[0]), parseInt(startTimeArr[1])).toISOString()
                const endTour = new Date(parseInt(darr[2]), parseInt(darr[1])-1, parseInt(darr[0]), parseInt(endTimeArr[0]), parseInt(endTimeArr[1])).toISOString()
                const orderDateTime = new Date().toISOString()

                TourPlans.create({
                    planId: genId,
                    bookId: bookID,
                    index: 0,
                    tourStart: 0,
                    tourEnd: 0,
                    tourPax: 0,
                    tourPrice: 0,
                    tourItinerary: 0,
                    accepted: 0,
                }).then(async (data) => {
                    console.log('hi')
                }).catch((err) => {
                    console.log(err)
                })
            }
        }).catch((err) => console.log)
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
