// Get root of project
const root = require('app-root-path')

// Logging
const log = require('loglevel')
const prefix = require('loglevel-plugin-prefix')
const chalk = require('chalk')
const colors = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
}
prefix.reg(log)
prefix.apply(log, {
    format(level, name, timestamp) {
        return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)}` // ${chalk.white(`${name}:`)}
    },
})
prefix.apply(log.getLogger('critical'), {
    format(level, name, timestamp) {
        return chalk.red.bold(`[${timestamp}] ${level} ${name}:`)
    },
})

try {
    module.exports = require(root + '/config.json')
} catch (error) {
    try {
        if (fs.existsSync(path)) {
            log.error('Genkan couldn\'t load the configuration file correctly. Please ensure that the file is not corrupted and is valid JSON.')
            process.exit()
        }
    } catch (err) {
        log.error('We have detected that this is a new installation of Genkan.\nA configuration file has been generated for you.\nPlease start Genkan back up after modifying the file to your desired settings.')
        process.exit()
    }
}
