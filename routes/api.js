// Express.js
const express = require('express')
const router = express.Router()

// Genkan Middleware
const { adminAuthorisationRequired, loginRequired } = require('../app/genkan/middleware')

// API Handlers
const { getAdminStats, getUserStats, getCSATStats } = require('../app/api/admin')
const { getMoneyStats, getTourGuideCSAT, getStatsRange, getTours } = require('../app/api/tourguide')
const roundTo = require('round-to')

const { generatePDFReport, generateCSVReport } = require('../app/reportGeneration/generate')
const { invokeSystemLogin } = require('../app/boot/invokeSystemLogin')

const fs = require('fs')

// Tour Guide Report Generation - File Download
// Test: http://localhost:5000/api/tourguide/generate_report?to=2021-08-01&from=2021-07-01&format=pdf
router.get('/tourguide/generate_report', loginRequired, async (req, res) => {
    // Get parameters; These are compulsary by the system.
    // See 'web' for API paramters.
    const { from, to, format } = req.query

    if (!from || !to) {
        return res.status(400).send({
            status: 400,
            message: 'Please provide a date range',
        })
    }

    if (format === 'pdf') {
        // Generate report in PDF format (Returns in base64)
        const pdf = await generatePDFReport(to, from, req.currentUser.id)

        // Set headers
        res.writeHead(200, {
            'Content-Disposition': `attachment; filename="${req.currentUser.name} - Income report (${from}-${to}).pdf"`,
            'Content-Type': 'application/pdf',
        })

        // Convert PDF to buffer from Base64
        const download = Buffer.from(pdf, 'base64')

        // Send the buffer to the client for download
        return res.end(download)
    }

    if (format === 'csv') {
        const currentUserId = req.currentUser.id

        const generatedReportName = await generateCSVReport(from, to, currentUserId)

        // Read the file from the disk
        const csvBuffer = fs.readFileSync(`./storage/csv_reports/${generatedReportName}.csv`)

        // Delete the file from the disk
        fs.unlinkSync(`./storage/csv_reports/${generatedReportName}.csv`)

        // Set headers
        res.writeHead(200, {
            'Content-Disposition': `attachment; filename="${req.currentUser.name} - Income report (${from}-${to}).csv"`,
            'Content-Type': 'text/csv',
        })

        // Send the buffer to the client for download
        return res.end(csvBuffer)
    }

    if (format === 'web') {
        // Use middleware to get user ID, if that doesn't work, use the query string
        // This provides compatibility with system generation of PDFs.
        const currentUserId = req.currentUser.id || req.query.for

        // If for query is provided, attempt to elevate privileges and validate authorisation.
        if (req.query.for) {
            if (req.cookies.apikey !== await invokeSystemLogin('INTERNAL API - Elevation Required by System')) {
                return res.status(401).send({
                    status: 401,
                    message: 'Unauthorised',
                })
            }
        }

        // Generate stats from API
        const stats = await getStatsRange(from, to, currentUserId)

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
                    totalEarningsBeforeSvc: stats.totalEarningsBeforeSvc.toFixed(2).toString(),
                    totalRevenue: stats.totalEarnings.toFixed(2).toString(),
                    totalTours: stats.totalTours,
                    serviceCharge: stats.serviceCharge.toFixed(2).toString(),
                    tours: await getTours(from, to, currentUserId),
                },
            },
        }

        return res.render('tourguide/print/report', metadata)
    }

    // If format is invalid, return JSON error.
    return res.status(400).send({
        status: 400,
        message: 'No valid format provided.',
    })
})

// Admin Panel API
router.get('/admin', adminAuthorisationRequired, async (req, res) => {
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
            currentPeriod: await getCSATStats(30),
            lastPeriod: await getCSATStats(60),
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
            currentPeriod: await getTourGuideCSAT(30, req.currentUser.id),
            lastPeriod: await getTourGuideCSAT(60, req.currentUser.id),
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
            m0: await getTourGuideCSAT(0, req.currentUser.id),
            m1: await getTourGuideCSAT(1 * 30, req.currentUser.id),
            m2: await getTourGuideCSAT(2 * 30, req.currentUser.id),
            m3: await getTourGuideCSAT(3 * 30, req.currentUser.id),
            m4: await getTourGuideCSAT(4 * 30, req.currentUser.id),
            m5: await getTourGuideCSAT(5 * 30, req.currentUser.id),
        },
    }

    return res.json(ResponseObject)
})

module.exports = router
