// Express.js
const express = require('express')
const router = express.Router()

// Genkan Middleware
const { adminAuthorisationRequired, loginRequired } = require('../app/genkan/middleware')

// Database Operations
const { Booking, User } = require('../models')
const { Op } = require('sequelize')

// Admin Fetch API
const { getAdminStats, getUserStats } = require('../app/api/admin')

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
        // totalNetIncomeDiff,
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

// router.get('/admin/charts', adminAuthorisationRequired, () => {

// })

module.exports = router
