'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const basename = path.basename(__filename)
const env = process.env.NODE_ENV || 'development'
const config = require(__dirname + '/../config/config.json')[env]
const db = {
    // Shop: sequelize.import('./shopTable'),
    // User: sequelize.import('./userTable'),
    // Session: sequelize.import('./sessionTable'),
}


let sequelize
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config)
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config)
}

fs
    .readdirSync(__dirname)
    .filter((file) => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
        db[model.name] = model
    })

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db)
    }
})

// This checks whether there is an active MySQL connection on start.
console.log('\x1b[1m\x1b[2m[DATABASE] - \x1b[1m\x1b[2mPENDING\x1b[0m: Checking connectivity...\x1b[0m')
sequelize.authenticate().then(() => {
    console.log('\x1b[1m\x1b[2m[DATABASE] - \x1b[1m\x1b[34mOK\x1b[0m: Connection established successfully.\x1b[0m')
}).catch(() => {
    console.log('\x1b[1m\x1b[2m[DATABASE] - \x1b[0m\x1b[1m\x1b[31m\x1b[5mFAILED\x1b[0m\x1b[31m: Connection to MySQL failed. Are you on the school network?\x1b[0m')
    process.exit(1)
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
