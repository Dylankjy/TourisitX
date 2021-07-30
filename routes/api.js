// Express.js
const express = require('express')
const router = express.Router()

// Genkan Middleware
const { adminAuthorisationRequired, loginRequired } = require('../app/genkan/middleware')

// Database Operations
const { Booking, User } = require('../models')
const { Op } = require('sequelize')

// API Handlers
const { getAdminStats, getUserStats } = require('../app/api/admin')
const { getMoneyStats, getTourGuideCSAT } = require('../app/api/tourguide')

// Admin Panel API
router.get('/admin', adminAuthorisationRequired, async (req, res) => {
    // Custom Satisfication
    // TODO: Implement, wait for table to be created.

    // Final JSON object to be returned
    const ResponseObject = {
        money: {
            currentPeriod: await getAdminStats(30),
            lastPeriod: await getAdminStats(60),
        },
        users: {
            currentPeriod: await getUserStats(30),
            lastPeriod: await getUserStats(60),
        },
        csat: {
            'Work in Progress': 1,
        },
    }

    return res.json(ResponseObject)
})

// Tour Guide Panel API
router.get('/tourguide', loginRequired, async (req, res) => {
    // Final JSON object to be returned
    const ResponseObject = {
        money: {
            currentPeriod: await getMoneyStats(30, req.currentUser.id),
            lastPeriod: await getMoneyStats(60, req.currentUser.id),
        },
        csat: {
            // Custom Satisfication
            // TODO: Implement, wait for table to be created.
            'Work in Progress': 1,
        },
    }

    return res.json(ResponseObject)
})

router.get('/tourguide/chart', loginRequired, async (req, res) => {
    // Final JSON object to be returned
    const ResponseObject = {
        money: {
            // TODO: Add additonal offset for month
            m0: await getMoneyStats(0, req.currentUser.id),
            m1: await getMoneyStats(1 * 30, req.currentUser.id),
            m2: await getMoneyStats(2 * 30, req.currentUser.id),
            m3: await getMoneyStats(3 * 30, req.currentUser.id),
            m4: await getMoneyStats(4 * 30, req.currentUser.id),
            m5: await getMoneyStats(5 * 30, req.currentUser.id),
        },
        csat: {
            // TODO: Use populated database table
            m0: await getTourGuideCSAT(),
            m1: await getTourGuideCSAT(),
            m2: await getTourGuideCSAT(),
            m3: await getTourGuideCSAT(),
            m4: await getTourGuideCSAT(),
            m5: await getTourGuideCSAT(),
        },
    }

    return res.json(ResponseObject)
})


module.exports = router
