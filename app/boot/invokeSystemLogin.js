const tokenGenerator = require('../genkan/tokenGenerator')
const uuid = require('uuid')

const { Session } = require('../../models')

let currentSystemSessionID = null

destroyAllSessions = async () => {
    console.log(`\x1b[1m\x1b[2m[LOGIN INVOKE] - \x1b[1m\x1b[34mOK\x1b[0m: Cleaning up SYSTEM sessions.\x1b[0m`)
    await Session.destroy({
        where: {
            userId: uuid.NIL,
        },
    })
}

invokeSystemLogin = async (actor) => {
    return new Promise((res)=>{
        console.log(
            `\x1b[1m\x1b[2m[LOGIN INVOKE] - \x1b[1m\x1b[35mPENDING\x1b[0m: \x1b[1m\x1b[2m(${actor})\x1b[0m Requesting session token.\x1b[0m`,
        )

        if (currentSystemSessionID === null) {
            const UnsignedSystemSession = tokenGenerator()
            currentSystemSessionID = UnsignedSystemSession

            // Get cookie from database
            return Session.create({
                userId: uuid.NIL,
                sessionId: UnsignedSystemSession,
            }).then(() => {
                console.log(
                    `\x1b[1m\x1b[2m[LOGIN INVOKE] - \x1b[1m\x1b[34mOK\x1b[0m: \x1b[1m\x1b[2m(${actor})\x1b[0m Session token received.\x1b[0m`,
                )
                return res(UnsignedSystemSession)
            })
        }

        console.log(
            `\x1b[1m\x1b[2m[LOGIN INVOKE] - \x1b[1m\x1b[34mOK\x1b[0m: \x1b[1m\x1b[2m(${actor})\x1b[0m Session already exists. Proceeding with token stored in memory...\x1b[0m`,
        )
        return res(currentSystemSessionID)
    })
}

module.exports = {
    destroyAllSessions,
    invokeSystemLogin,
}
