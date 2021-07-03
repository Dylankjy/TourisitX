// User model
const { User } = require('../models')

// UUID
const uuid = require('uuid')

// Number of users to make
const numberOfUsersToPopulate = 50

for (let i = 0; i < numberOfUsersToPopulate; i++) {
    // Because this generates a f*** ton of users very quickly. Opted to use v4 of UUID to prevent any collisions, though this is highly unlikely. But just in case!
    NewUserSchema = {
        'id': uuid.v4(),
        'name': `Test User #${i}`,
        'email': `test_user${i}@tourisit.local`,
        'password': 'nologin',
        'lastseen_time': new Date(),
        'ip_address': '127.0.0.1', // TODO: Add IP Address mechanism
    }

    User.create(NewUserSchema).then(() => {
        console.log(`Added record - Test User #${i}`)
    }).catch((err) => {
        throw err
    })
}
