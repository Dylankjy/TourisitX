const { Booking, Shop, Review } = require('../../models')
const { Op } = require('sequelize')

const syncLoop = require('sync-loop')
const roundTo = require('round-to')

const dateFormat = require('dateformat')

// Formula to get number of ms in a day -- This is here because I don't want to have to keep typing this.
const oneDay = 24 * 60 * 60 * 1000

const getMoneyStats = async (offset, tguid) => {
    const startOffset = offset * oneDay
    let endOffset = 0
    if (offset > 30) {
        endOffset = (offset - 30) * oneDay
    }

    const allTours = await Booking.findAll({ where: { 'createdAt': { [Op.between]: [(new Date()) - startOffset, new Date() - endOffset] }, 'paid': true, 'tgid': tguid } })

    // Initial values
    let totalEarnings = 0
    let averageEarnings = 0

    // Only if there are tours, calculate the stats. This prevents a divide by 0 error.
    if (allTours.length !== 0) {
        totalEarnings = allTours.map((booking) => parseFloat(booking.bookBaseprice) + parseFloat(booking.bookCharges.split(',').reduce((a, b) => a + b))).reduce((a, b) => a + b) * 0.85
        averageEarnings = totalEarnings / allTours.length
    }

    return {
        totalEarnings: roundTo(totalEarnings, 2).toFixed(2).toString(),
        averageEarnings: roundTo(averageEarnings, 2).toFixed(2).toString(),
    }
}

const getStatsRange = async (to, from, tguid) => {
    const allTours = await Booking.findAll({ where: { 'createdAt': { [Op.between]: [new Date(to), new Date(from)] }, 'paid': true, 'tgid': tguid } })

    // Initial values
    let totalEarningsBeforeSvc = 0
    let totalEarnings = 0
    let serviceCharge = 0
    let averageEarnings = 0
    const totalTours = allTours.length


    // Only if there are tours, calculate the stats. This prevents a divide by 0 error.
    if (allTours.length !== 0) {
        totalEarningsBeforeSvc = allTours.map((booking) => parseFloat(booking.bookBaseprice) + parseFloat(booking.bookCharges.split(',').reduce((a, b) => a + b))).reduce((a, b) => a + b)
        totalEarnings = totalEarningsBeforeSvc * 0.85
        serviceCharge = totalEarningsBeforeSvc * 0.15
        averageEarnings = totalEarnings / allTours.length
    }

    return {
        totalEarningsBeforeSvc,
        totalEarnings,
        averageEarnings,
        serviceCharge,
        totalTours,
    }
}

const getTours = (to, from, tguid, dateInCSV = false) => {
    return new Promise(async (res) => {
        const allPaidTours = await Booking.findAll({ where: { 'createdAt': { [Op.between]: [new Date(to), new Date(from)] }, 'paid': true, 'tgid': tguid } })

        const reconstructedBookingList = []

        // Another one of those shitty syncLoops because data reconstruction is a pain in the ass.
        await syncLoop(allPaidTours.length, async (loop) => {
            const i = loop.iteration()

            const listingId = allPaidTours[i].listingId
            const tourNameOfBooking = (await Shop.findAll({ where: { 'id': listingId } }))[0].tourTitle
            const bookDate = allPaidTours[i].createdAt
            const amount = parseFloat(allPaidTours[i].bookBaseprice) + parseFloat(allPaidTours[i].bookCharges.split(',').reduce((a, b) => a + b))

            if (!dateInCSV) {
                reconstructedBookingList.push({
                    no: i + 1,
                    name: tourNameOfBooking,
                    bookingId: allPaidTours[i].bookId,
                    date: bookDate,
                    amount: roundTo(amount, 2).toFixed(2).toString(),
                })
            } else {
                reconstructedBookingList.push({
                    no: i + 1,
                    name: tourNameOfBooking,
                    bookingId: allPaidTours[i].bookId,
                    date: dateFormat(bookDate, 'dd-mm-yyyy'),
                    amount: roundTo(amount, 2).toFixed(2).toString(),
                })
            }
            loop.next()
        }, () => {
            return res(reconstructedBookingList)
        })
    })
}

const getTourGuideCSAT = async (offset, tguid) => {
    const startOffset = offset * oneDay
    let endOffset = 0
    if (offset > 30) {
        endOffset = (offset - 30) * oneDay
    }

    const allReviewsThisPeriod = await Review.findAll({ where: { 'subjectId': tguid, 'createdAt': { [Op.between]: [(new Date()) - startOffset, new Date() - endOffset] } } })
    const allReviewsOverall = await Review.findAll({ where: { 'subjectId': tguid } })

    const numberOfReviews = allReviewsThisPeriod.length

    // For this month only
    let CSATForPeriod = null
    if (numberOfReviews !== 0) {
        CSATForPeriod = (allReviewsThisPeriod.map((entry) => parseInt(entry.rating)).reduce((a, b) => a + b) / numberOfReviews / 5) * 100
    }

    // Average rating overall
    let CSATOverall = 100
    if (allReviewsOverall.length !== 0) {
        CSATOverall = (allReviewsOverall.map((entry) => parseInt(entry.rating)).reduce((a, b) => a + b) / numberOfReviews / 5) * 100
    }

    return {
        numberOfReviews,
        CSATForPeriod,
        CSATOverall,
    }
}

module.exports = {
    getMoneyStats,
    getStatsRange,
    getTours,
    getTourGuideCSAT,
}
