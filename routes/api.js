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
const { getMoneyStats } = require('../app/api/tourguide')

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

// Admin Panel API
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


module.exports = router
