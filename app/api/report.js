const { Booking, User } = require('../../models')
const { Op } = require('sequelize')

// Formula to get number of ms in a day -- This is here because I don't want to have to keep typing this.
const oneDay = 24 * 60 * 60 * 1000

// const a = () => { }
