// Express.js
const express = require('express')
const router = express.Router()

// Genkan Middleware
const { adminAuthorisationRequired, loginRequired } = require('../app/genkan/middleware')

// Database Operations
const { Booking, User } = require('../models')
const { Op } = require('sequelize')

// Admin Panel API
router.get('/admin', adminAuthorisationRequired, async (req, res) => {
    // Calculating moneys
    const wildcardBookingRecords = await Booking.findAll({})
    const totalIncome = wildcardBookingRecords.map((booking) => parseFloat(booking.bookBaseprice) + parseFloat(booking.bookCharges)).reduce((a, b) => a + b)
    const totalBookings = wildcardBookingRecords.length
    const totalGrossProfits = totalIncome * 0.15

    // User analytics
    const totalUsers = (await User.findAll({})).length
    const totalActiveUsers = (await User.findAll({ createdAt: { [Op.between]: [(new Date()) - 24, new Date()] } })).length
    const totalNewUsers = (await User.findAll({ createdAt: { [Op.between]: [(new Date()) - 4, new Date()] } })).length

    // Custom Satisfication
    // TODO: Implement, wait for table to be created.

    // Final JSON object to be returned
    const ResponseObject = {
        money: {
            totalIncome,
            totalBookings,
            totalGrossProfits,
        },
        users: {
            totalUsers,
            totalActiveUsers,
            totalNewUsers,
        },
        csat: {
            'Work in Progress': 1,
        },
    }

    return res.json(ResponseObject)
})

module.exports = router
