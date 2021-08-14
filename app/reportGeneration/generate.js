// Config
const routeConfig = require('../../config/routes.json')

// System login invoker
const { invokeSystemLogin } = require('../boot/invokeSystemLogin')

// PDF generation
const puppeteer = require('puppeteer')

// API Handlers
const { getStatsRange, getTours } = require('../api/tourguide')
const roundTo = require('round-to')

const tokenGenerator = require('../genkan/tokenGenerator')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

generatePDFReport = (fromDate, toDate, uid) => {
    return new Promise(async (res) => {
        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()

        await page.setCookie(
            {
                name: 'apikey',
                value: await invokeSystemLogin('INTERNAL API - PDF Generator'),
                domain: routeConfig.domain,
            },
        )

        await page.goto(`${routeConfig.base_url}/api/tourguide/generate_report?from=${fromDate}&to=${toDate}&format=web&for=${uid}`, { waitUntil: 'networkidle0' })
        const pdf = await page.pdf({ format: 'A4' })

        await browser.close()

        return res(pdf)
    })
}

generateCSVReport = (fromDate, toDate, uid) => {
    return new Promise(async (res) => {
        // Generate stats from API
        const stats = await getStatsRange(fromDate, toDate, uid)

        const tourData = await getTours(fromDate, toDate, uid, true)

        // Use genkan's token generator to generate a secure random file name.
        // Not like this matters anyways but to be safe.
        const fileName = tokenGenerator()

        const csvWriter = createCsvWriter({
            path: `./storage/csv_reports/${fileName}.csv`,
            header: [
                { id: 'no', title: 'No.' },
                { id: 'name', title: 'Tour Name' },
                { id: 'date', title: 'Booking Creation date' },
                { id: 'amount', title: 'Amount' },
            ],
        })

        // Add total and service charge to bottom of the report
        tourData.push(
            {
                no: '',
                name: 'Service charge (15%)',
                date: '',
                amount: roundTo(-stats.serviceCharge, 2).toFixed(2).toString(),
            },
            {
                no: '',
                name: 'Net Total',
                date: '',
                amount: roundTo(stats.totalEarnings, 2).toFixed(2).toString(),
            },
        )

        // Write the data to the CSV file
        await csvWriter.writeRecords(tourData)

        return res(fileName)
    })
}

module.exports = {
    generatePDFReport,
    generateCSVReport,
}
