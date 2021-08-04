const { Booking, User, Review } = require('../../models')
const { Op } = require('sequelize')

// Formula to get number of ms in a day -- This is here because I don't want to have to keep typing this.
const oneDay = 24 * 60 * 60 * 1000

const getAdminStats = async (offset) => {
    const startOffset = offset * oneDay
    let endOffset = 0
    if (offset > 30) {
        endOffset = (offset - 30) * oneDay
    }

    // Calculating moneys
    const bookingRecords = await Booking.findAll({ where: { 'createdAt': { [Op.between]: [(new Date()) - startOffset, new Date() - endOffset] } } })

    let totalIncome
    if (bookingRecords.length !== 0) {
        totalIncome = bookingRecords.map((booking) => parseFloat(booking.bookBaseprice) + parseFloat(booking.bookCharges.split(',').reduce((a, b) => a + b))).reduce((a, b) => a + b)
    } else {
        totalIncome = 0
    }

    const totalBookings = bookingRecords.length
    const totalNetIncome = totalIncome * 0.15

    return { totalIncome, totalBookings, totalNetIncome }
}

const getUserStats = async (offset) => {
    const startOffset = offset * oneDay
    let endOffset = 0
    if (offset > 30) {
        endOffset = (offset - 30) * oneDay
    }

    // User analytics
    const totalUsers = (await User.findAll({})).length
    const totalActiveUsers = (await User.findAll({ where: { 'lastseen_time': { [Op.between]: [(new Date()) - startOffset, new Date() - endOffset] } } })).length
    const totalNewUsers = (await User.findAll({ where: { 'createdAt': { [Op.between]: [(new Date()) - ((oneDay * 4) + endOffset), new Date() - endOffset] } } })).length

    return {
        totalUsers,
        totalActiveUsers,
        totalNewUsers,
    }
}

const getCSATStats = async (offset) => {
    const startOffset = offset * oneDay
    let endOffset = 0
    if (offset > 30) {
        endOffset = (offset - 30) * oneDay
    }

    const allReviews = await Review.findAll({ where: { 'createdAt': { [Op.between]: [(new Date()) - startOffset, new Date() - endOffset] } } })

    const numberOfReviews = allReviews.length

    const numberOfPositive = (await Review.findAll({ where: { 'createdAt': { [Op.between]: [(new Date()) - startOffset, new Date() - endOffset] }, 'rating': { [Op.gte]: 3 } } })).length
    const numberOfNegative = (await Review.findAll({ where: { 'createdAt': { [Op.between]: [(new Date()) - startOffset, new Date() - endOffset] }, 'rating': { [Op.lt]: 3 } } })).length

    let percentage = 100
    if (numberOfReviews !== 0) {
        percentage = (allReviews.map((entry) => entry.rating).reduce((a, b) => a + b) / (numberOfReviews * 5)) * 100
    }

    return {
        numberOfPositive,
        numberOfNegative,
        percentage,
    }
}

module.exports = {
    getAdminStats,
    getUserStats,
    getCSATStats,
}
