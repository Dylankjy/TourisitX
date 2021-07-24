// This is a sequelize wrapper that accepts MongoDB-like code syntax that I always use.
// 僕はSequelizeが嫌いなので、このコードは僕のGPAについてに必要です。自殺させていただけないでしょうかなああああ？？？

// SQLize imports
const { Shop, User, Support, Session, Token, ChatRoom, ChatMessages, Booking, TourPlans } = require('../models')

governor = (table) => {
    switch (table.toLowerCase()) {
    case 'shop':
        return Shop
    case 'user':
        return User
    case 'support':
        return Support
    case 'session':
        return Session
    case 'token':
        return Token
    case 'chatroom':
        return ChatRoom
    case 'chatmessages':
        return ChatMessages
    case 'booking':
        return Booking
    case 'tourplans':
        return TourPlans
    default:
        throw new Error('Invalid table selection execution in wrapper. Have you added it to the governor?')
    }
}


insertDB = (table, docs, callback) => {
    governor(table).create(docs).then(() => {
        // Successful create: Returns boolean TRUE
        return callback(true)
    }).catch((err) => {
        throw err
    })
}

updateDB = (table, query, docs, callback) => {
    governor(table).update(docs, {
        where: query,
    }).catch((err)=>{
        throw err
    }).then((data) => {
        // Successful update
        return callback(data)
    }).catch((err)=> {
        throw err
    })
}

findDB = (table, query, callback) => {
    governor(table).findAll({ where: query }).then((items)=>{
        return callback(items)
    }).catch((err) => {
        throw err
    })
}

deleteDB = (table, query, callback) => {
    governor(table).destroy({
        where: query,
    }).then((data) => {
        return callback(true)
    }).catch((err) => {
        return callback(false)
    })
}

// module.exports = insertDB
// module.exports = updateDB
// module.exports = deleteDB
// module.exports = findDB

module.exports = { insertDB, updateDB, deleteDB, findDB }
