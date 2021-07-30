const { Booking, User } = require('../../models')
const { Op } = require('sequelize')

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
        totalEarnings,
        averageEarnings,
    }
}

const getTourGuideCSAT = async () => {
    // TODO
    // When CSAT table is created.

    return 0
}

module.exports = {
    getMoneyStats,
    getTourGuideCSAT,
}
