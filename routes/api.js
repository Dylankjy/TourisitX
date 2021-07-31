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
const { getMoneyStats, getTourGuideCSAT, getStatsRange, getTours } = require('../app/api/tourguide')
const roundTo = require('round-to')

// Tour Guide Report Generation
// Test: http://localhost:5000/api/tourguide/generate_report?to=2021-08-01&from=2021-07-01
router.get('/tourguide/generate_report', loginRequired, async (req, res) => {
    // Get parameters
    const { from, to, format } = req.query

    if (!from || !to) {
        return res.status(400).send({
            status: 400,
            message: 'Please provide a date range',
        })
    }

    // if (format === 'csv') {

    // }

    const stats = await getStatsRange(from, to, req.currentUser.id)

    const metadata = {
        meta: {
            title: 'Income Report',
        },
        layout: 'print',
        data: {
            currentUser: req.currentUser,
            dateGenerated: new Date(),
            report: {
                from,
                to,
                totalEarningsBeforeSvc: roundTo(stats.totalEarningsBeforeSvc, 2).toFixed(2).toString(),
                totalRevenue: roundTo(stats.totalEarnings, 2).toFixed(2).toString(),
                totalTours: stats.totalTours,
                serviceCharge: roundTo(stats.serviceCharge, 2).toFixed(2).toString(),
                tours: await getTours(from, to, req.currentUser.id),
            },
        },
    }

    return res.render('tourguide/print/report', metadata)
})

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
