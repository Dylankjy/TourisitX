// Load environment
const config = require('../../config/genkan.json')

// Database operations
require('../db')

logoutAccount = (sid, isAll, callback) => {
    // Find account to get stored hashed
    findDB('session', { 'sessionId': sid }, (result) => {
        // If such session is found
        if (result.length !== 1) {
            return callback(false)
        }

        // Payload to update user's last seen in users collection
        const UpdateLastSeenPayload = {
            'lastseen_time': new Date(),
        }

        if (isAll === true) {
            return deleteDB('session', { 'userId': result[0].dataValues.userId }, () => {
                return updateDB('user', { 'id': result[0].dataValues.userId }, UpdateLastSeenPayload, () => {
                    return callback()
                })
            })
        }

        // Update database
        deleteDB('session', { 'sessionId': sid }, () => {
            updateDB('user', { 'id': result[0].dataValues.userId }, UpdateLastSeenPayload, () => {
                return callback()
            })
        })
    })
}

// logoutAccount('48a7f4eff016610858ceb76727d34140cd57f572386a92b789676ec2eadca8a7f965db36538e90d093133cce9602731137120b924a937c74e56afddf72d35c6b', true, () => {
//     console.log('OK')
// })

module.exports = logoutAccount
