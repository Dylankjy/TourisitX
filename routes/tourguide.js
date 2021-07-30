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
