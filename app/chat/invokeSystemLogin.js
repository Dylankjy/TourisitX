const tokenGenerator = require('../genkan/tokenGenerator')
const uuid = require('uuid')

const { Session } = require('../../models')

invokeSystemLogin = async () => {
    return new Promise((res)=>{
        console.log(
            '\x1b[1m\x1b[2m[SOCKET - Chat] - \x1b[1m\x1b[35mPENDING\x1b[0m: Waiting for session token (Requested for System Object Account).\x1b[0m',
        )
        const UnsignedSystemSession = tokenGenerator()

        Session.destroy({
            where: {
                userId: uuid.NIL,
            },
        }).then(() => {
            // Get cookie from database
            Session.create({
                userId: uuid.NIL,
                sessionId: UnsignedSystemSession,
            }).then(() => {
                console.log(
                    '\x1b[1m\x1b[2m[SOCKET - Chat] - \x1b[1m\x1b[34mOK\x1b[0m: Received session token, proceeding with connection.\x1b[0m',
                )
                return res(UnsignedSystemSession)
            })
        })
    })
}

module.exports = {
    invokeSystemLogin,
}
