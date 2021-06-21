// This is a sequelize wrapper that accepts MongoDB-like code syntax that I always use.
// 僕はSequelizeが嫌いなので、このコードは僕のGPAについてに必要です。自殺させていただけないでしょうかなああああ？？？

insertDB = (table, docs, callback) => {
    const db = require(`../models/${table}Table`)

    db.create(docs).then(() => {
        // Successful create: Returns boolean TRUE
        return callback(true)
    }).catch((err) => {
        throw err
    })
}

updateDB = (table, query, docs, callback) => {
    const db = require(`../models/${table}Table`)

    db.update(docs, {
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
    const db = require(`../models/${table}Table`)

    db.findAll({ where: query }).then((items)=>{
        return callback(items)
    }).catch((err) => {
        throw err
    })
}

deleteDB = (table, query, callback) => {
    const db = require(`../models/${table}Table`)

    db.destroy({
        where: query,
    }).then((data) => {
        return callback(true)
    }).catch((err) => {
        return callback(false)
    })
}

module.exports = insertDB
module.exports = updateDB
module.exports = deleteDB
module.exports = findDB
