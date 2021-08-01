const tokenGenerator = require('../genkan/tokenGenerator')
const uuid = require('uuid')

const { Session } = require('../../models')

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
            `\x1b[1m\x1b[2m[LOGIN INVOKE] - \x1b[1m\x1b[35mPENDING\x1b[0m: Waiting for session token (Requester: ${actor}).\x1b[0m`,
        )
        const UnsignedSystemSession = tokenGenerator()

        // Get cookie from database
        Session.create({
            userId: uuid.NIL,
            sessionId: UnsignedSystemSession,
        }).then(() => {
            console.log(
                '\x1b[1m\x1b[2m[LOGIN INVOKE] - \x1b[1m\x1b[34mOK\x1b[0m: Session token received.\x1b[0m',
            )
            return res(UnsignedSystemSession)
        })
    })
}

module.exports = {
    destroyAllSessions,
    invokeSystemLogin,
}
