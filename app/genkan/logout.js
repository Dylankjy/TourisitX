// Load environment
const config = require('../../config/genkan.json')

logoutAccount = (sid, isAll, callback) => {
    // Find account to get stored hashed
    findDB('session', { 'sid': sid }, (result) => {
        // If such session is found
        if (result.length !== 1) {
            return callback(false)
        }

        // Payload to update user's last seen in users collection
        const UpdateLastSeenPayload = {
            'lastseen_time': new Date(),
        }

        if (isAll === false) {
            deleteDB('session', { 'userId': result[0].userId }, () => {
                updateDB('user', { 'id': ObjectId(result[0].userId) }, UpdateLastSeenPayload, () => {
                    return callback()
                })
            })
        }

        // Update database
        deleteDB('session', { 'sid': sid }, () => {
            updateDB('user', { 'id': ObjectId(result[0].userId) }, UpdateLastSeenPayload, () => {
                return callback()
            })
        })
    })
}
module.exports = logoutAccount
