// User model
const { User } = require('../models')

const Sequelize = require('sequelize')
const Op = Sequelize.Op

User.destroy({
    where: {
        email: {
            [Op.like]: 'test_user%@tourisit.local',
        },
    },
}).then((data) => {
    console.log('Completed without errors.')
}).catch((err) => {
    return callback(false)
})
