const express = require('express')
const { default: axios } = require('axios')

const router = express.Router()
const { Shop, User, Booking, ChatRoom, TourPlans, ChatMessages, Review, sequelize } = require('../models')

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

    const bookType = req.query.type

    let processStepQuery
    let bookCount = 0
    let bookList
    let lastPage = 1
    let reqAction
    let upcoming
    let reqTest
    if (bookType) {
        if (bookType == 'planning') {
            processStepQuery = ['1', '2', '3']
        } else if (bookType == 'confirmed') {
            processStepQuery = '4'
        } else if (bookType == 'completed') {
            processStepQuery = '5'
        } else {
            res.redirect(`/bookings`)
        }
        const bookings = await Booking.findAndCountAll({
            where: {
                custId: req.currentUser.id,
                approved: 1,
                processStep: processStepQuery,
            },
            attributes: ['bookId', 'processStep', 'completed'],
            // order: [['updatedAt', 'DESC']],
            include: [
                { model: Shop,
                    attributes: ['tourTitle', 'tourImage'] },
                { model: Review,
                    required: false,
                    attributes: ['id'],
                    where: { reviewerId: req.currentUser.id } }],
            raw: true,
            limit: pageSize,
            // offset: offset,
        })

        if (bookings) {
            console.log(bookings)
            bookCount = bookings.count
            bookList = bookings.rows
            lastPage = Math.ceil(bookCount / pageSize)
            if (pageNo > lastPage) {
                res.redirect(`/bookings?type=${bookType}&page=${lastPage}`)
            }
        }
    } else {
        // Overview

        reqAction = await Booking.findAndCountAll({
            where: {
                custId: req.currentUser.id,
                approved: 1,
                processStep: ['2', '3', '4', '5'],
            },
            // where: sequelize.literal('Reviews.reviewerId != Booking.custId OR Reviews.id IS NULL'),
            attributes: ['bookId', 'processStep'],
            order: [['updatedAt', 'ASC']],
            include: [
                { model: Shop,
                    attributes: ['tourTitle'] },
                { model: Review,
                    required: false,
                    where: sequelize.literal('Reviews.type != "CUST"'),
                    attributes: ['id', 'reviewerId', 'type', 'reviewText'] }],
            raw: true,
        })

        upcoming = await Booking.findAndCountAll({
            where: {
                custId: req.currentUser.id,
                approved: 1,
                processStep: '4',
            },
            attributes: ['bookId', 'processStep', 'tourStart'],
            order: [['tourStart', 'DESC']],
            include:
                    { model: Shop,
                        attributes: ['tourTitle'] },
            raw: true,
        })
    }
    const metadata = {
        meta: {
            title: 'All Bookings',
            pageNo: pageNo,
            count: bookCount,
            lastPage: lastPage,
            type: bookType,
        },
        data: {
            currentUser: req.currentUser,
            bookList: bookList,
            reqAction: reqAction,
            upcoming: upcoming,
        },
    }
    return res.render('allBookings.hbs', metadata)
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
            addMessage(bookData['chatId'], req.currentUser.id, tourType, 'REVIEW', () => {
                if (req.currentUser.id == bookData['custId']) {
                    res.redirect(`/bookings/${bookId}`)
                } else if (req.currentUser.id == bookData['tgId']) {
                    res.redirect(`/tourguide/bookings/${bookId}`)
                }
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

    if (bookData.custId != req.currentUser.id) {
        res.redirect(`/bookings`)
    }
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
