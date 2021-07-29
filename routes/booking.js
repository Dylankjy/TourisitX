const express = require('express')
const { default: axios } = require('axios')

const router = express.Router()
const { Shop, User, Booking, ChatRoom, TourPlans, ChatMessages } = require('../models')

const uuid = require('uuid')

const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
const Validator = formidableValidator.Validator
router.use(formidable())

const genkan = require('../app/genkan/genkan')
const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray, getUserfromSid } = require('../app/helpers')
const { addRoom, getAllBookingMessagesByRoomID } = require('../app/chat/chat')

// Sync loops
const syncLoop = require('sync-loop')
const { route } = require('./tourguide')

// Put all your routings below this line -----

// const tourPlans = [
//     { planId: '555',
//         bookId: 'bookweee',
//         index: 0,
//         tourStart: new Date().toISOString(),
//         tourEnd: new Date().toISOString(),
//         tourPax: '5',
//         tourPrice: '300',
//         tourItinerary: 'Go to the chopper at bshan an eat some duck rice,Ride to outskirts of SG e',
//         accepted: '-1' },
// ]

router.get('/', async (req, res) => {
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

    // If person is not logged in
    if (sid == undefined) {
        return requireLogin(res)
    } else {
        const userData = await genkan.getUserBySessionAsync(sid)
        Booking.findAndCountAll({
            where: {
                custId: userData.id,
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
                }
                return res.render('allBookings.hbs', metadata)
                // }).catch((err) => console.log)
            }).catch((err) => console.log)
    }
})

router.post('/:id/request-revision', (req, res) => {
    // what.   wh a t.
    const bookId = req.params.id

    const v = new Validator(req.fields)
    const requestResult = v
        .Initialize({
            name: 'requestField',
            errorMessage: 'Please enter your requirements.',
        })
        .exists()
        .getResult()

    const validationErrors = removeNull([
        requestResult,
    ])
    if (!emptyArray(validationErrors)) {
        console.log('ooga valid error')
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/bookings/${bookId}`)
    } else {
        res.clearCookie('validationErrors')
        Booking.update({
            where: { bookId: bookId },
        })
        // move process step and add the req to req array
        // update tour plan to rejected

        TourPlans.findOne({
            where: {
                bookId: bookId,
            },
            order: [
                ['createdAt', 'DESC'],
            ],
            raw: true,
        }).then((tourPlanData) => {
            console.log(tourPlanData)

            res.redirect(`/bookings/${bookId}`)
        })
    }
})

router.post('/fastTravel/:id', (req, res) => {
    // bookId = req.params.id
    console.log('lmao')
    res.redirect(`/bookings/${bookId}`)
})

router.get('/:id', (req, res) => {
    // console.log(req.currentUser.name)
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
    }) .then((result) => {
        console.log(result)
        // const sid = req.signedCookies.sid
        // const userId = await genkan.getUserBySessionAsync(sid)
        TourPlans.findAndCountAll({
            where: {
                bookId: bookID,
            },
            raw: true,
        }) .then((tourPlanData) => {
            console.log(tourPlanData.rows)

            getAllTypesOfMessagesByRoomID(result.chatId, (chatroomObject) => {
                console.log(chatroomObject)

                const listOfParticipantNames = []

                // This is a hacky way to get the names of the participants in a chat room.
                syncLoop(chatroomObject.users.length, (loop) => {
                    const i = loop.iteration()

                    genkan.getUserByID(chatroomObject.users[i], (userObject) => {
                    // console.log(userObject)
                        listOfParticipantNames.push(userObject.name)
                        loop.next()
                    })
                }, () => {
                    genkan.getUserByID(result['Shop.userId'], (tgData) => {
                        console.log(tgData)
                        const chargesArr = result['bookCharges'].split(',')
                        console.log(chargesArr)
                        const metadata = {
                            meta: {
                                title: result['Shop.tourTitle'],
                            },
                            data: {
                                currentUser: req.currentUser,
                                book: result,
                                timeline: chatroomObject.msg,
                                // This is the list of names of participants in the chat room.
                                participants: listOfParticipantNames,
                                tg: tgData,
                                bookCharges: chargesArr,
                            },
                            tourPlans: tourPlanData.rows,
                        }
                        return res.render('myBooking.hbs', metadata)
                    })
                })
            })
        })
    })
})

module.exports = router
