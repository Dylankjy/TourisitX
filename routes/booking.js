const express = require('express')
const { default: axios } = require('axios')

const router = express.Router()
const { Shop, User, Booking, ChatRoom, TourPlans, ChatMessages, Review } = require('../models')

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
                // completed: 0,
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

router.post('/:id/request-revision', async (req, res) => {
    const bookId = req.params.id
    console.log(req.fields)

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

        bookData = await Booking.findOne({
            where: {
                bookId: bookId,
            },
            raw: true,
        })

        console.log(bookData)

        const newReq = bookData['custRequests'] + ';!;' + req.fields.requestField
        console.log(newReq)

        tourPlan = await TourPlans.findOne({
            where: {
                bookId: bookId,
            },
            order: [
                ['createdAt', 'DESC'],
            ],
            raw: true,
        })

        console.log(tourPlan)

        Booking.update({
            processStep: '1',
            custRequests: newReq,
        }, {
            where: { bookId: bookId },
        }).then(() =>{
            TourPlans.update({
                accepted: '-1',
            }, {
                where: { planId: tourPlan['planId'] },
            })
            addMessage(bookData['chatId'], 'SYSTEM', '<customer> requested a revision of the Tour Plan.', 'ACTIVITY', () => {
                res.redirect(`/bookings/${bookId}`)
            })
        })
    }
})

router.post('/:id/accept-plan', async (req, res) => {
    const bookId = req.params.id
    console.log(req.fields)

    bookData = await Booking.findOne({
        where: {
            bookId: bookId,
        },
        raw: true,
    })

    console.log(bookData)

    tourPlan = await TourPlans.findOne({
        where: {
            bookId: bookId,
        },
        order: [
            ['createdAt', 'DESC'],
        ],
        raw: true,
    })

    console.log(tourPlan)

    Booking.update({
        processStep: '3',
    }, {
        where: { bookId: bookId },
    }).then(() =>{
        TourPlans.update({
            accepted: '1',
        }, {
            where: { planId: tourPlan['planId'] },
        })
        addMessage(bookData['chatId'], 'SYSTEM', '<customer> accepted the Tour Plan.', 'ACTIVITY', () => {
            res.redirect(`/bookings/${bookId}`)
        })
    })
})

router.post('/:id/complete-tour', async (req, res) => {
    const bookId = req.params.id
    console.log(req.fields)

    bookData = await Booking.findOne({
        where: {
            bookId: bookId,
        },
        raw: true,
    })

    console.log(bookData)

    Booking.update({
        processStep: '5',
        completed: 1,
    }, {
        where: { bookId: bookId },
    }).then(() =>{
        addMessage(bookData['chatId'], 'SYSTEM', '<customer> declared that the tour is complete.', 'ACTIVITY', () => {
            res.redirect(`/bookings/${bookId}`)
        })
    })
})

router.post('/:id/review-tour', async (req, res) => {
    const bookId = req.params.id
    console.log(req.fields)

    const v = new Validator(req.fields)
    const ratingResult = v
        .Initialize({
            name: 'rating',
            errorMessage: 'Please provide a rating from 1 to 5.',
        })
        .exists()
        .getResult()

    const reviewTextResult = v
        .Initialize({
            name: 'reviewText',
            errorMessage: 'Please describe your experience.',
        })
        .exists()
        .getResult()

    const validationErrors = removeNull([
        ratingResult,
        reviewTextResult,
    ])
    if (!emptyArray(validationErrors)) {
        console.log('ooga valid error')
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/bookings/${bookId}`)
    } else {
        res.clearCookie('validationErrors')

        // make review
        bookData = await Booking.findOne({
            where: {
                bookId: bookId,
            },
            raw: true,
        })

        console.log(bookData)

        let tourType = ''
        let subjectId = ''
        if (bookData['custId'] == req.currentUser.id) {
            console.log('tour rev')
            tourType = 'TOUR'
            subjectId = bookData['tgId']
        } else if (bookData['tgId'] == req.currentUser.id) {
            console.log('cust rev')
            tourType = 'CUST'
            subjectId = bookData['custId']
        }

        const genId = uuid.v1()
        Review.create(
            {
                id: genId,
                type: tourType,
                reviewerId: req.currentUser.id,
                subjectId: subjectId,
                tourId: bookData['listingId'],
                bookId: bookId,
                reviewText: req.fields.reviewText,
                rating: req.fields.rating,

            },
        ).then((data) => {
            addMessage(bookData['chatId'], 'SYSTEM', tourType, 'REVIEW', () => {
                res.redirect(`/bookings/${bookId}`)
            })
        })
    }
})

router.get('/:id', async (req, res) => {
    // console.log(req.currentUser.name)
    const bookID = req.params.id

    const bookData = await Booking.findOne({
        where: {
            bookId: bookID,
        },
        include: Shop, TourPlans,
        raw: true,
    })
    console.log(bookData)
    // const sid = req.signedCookies.sid
    // const userId = await genkan.getUserBySessionAsync(sid)

    const tourPlanData = await TourPlans.findAndCountAll({
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
    console.log(reviews)

    getAllTypesOfMessagesByRoomID(bookData.chatId, (chatroomObject) => {
        // console.log(chatroomObject)

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
            genkan.getUserByID(bookData['Shop.userId'], (tgData) => {
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
                const metadata = {
                    meta: {
                        title: bookData['Shop.tourTitle'],
                    },
                    data: {
                        currentUser: req.currentUser,
                        book: bookData,
                        timeline: chatroomObject.msg,
                        // This is the list of names of participants in the chat room.
                        participants: listOfParticipantNames,
                        tg: tgData,
                        bookCharges: chargesArr,
                        reviews: reviews,
                        charges: {
                            bookCharges: chargesArr,
                            customFee: revisionFee,
                            priceToPay: priceToPay,
                            extraRevFees: extraRevFees,
                        },
                    },
                    tourPlans: tourPlanData.rows,
                }
                return res.render('myBooking.hbs', metadata)
            })
        })
    })
})

module.exports = router
