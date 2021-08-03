// Config
const routeConfig = require('../../config/routes.json')

// System login invoker
const { invokeSystemLogin } = require('../boot/invokeSystemLogin')

// PDF generation
const puppeteer = require('puppeteer')

generatePDFReport = (fromDate, toDate, uid) => {
    return new Promise(async (res) => {
        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()

        await page.setCookie(
            {
                name: 'apikey',
                value: await invokeSystemLogin('INTERNAL API - PDF Generator'),
                domain: 'localhost:5000',
            },
        )

        await page.goto(`${routeConfig.base_url}/api/tourguide/generate_report?from=${fromDate}&to=${toDate}&format=web&for=${uid}`, { waitUntil: 'networkidle0' })
        const pdf = await page.pdf({ format: 'A4' })

        await browser.close()

        return res(pdf)
    })
}

module.exports = {
    generatePDFReport,
}
