// This file's existance is only justified by the number of times we had to purge the database
// You can take 5 minutes to recreate system objects everytime, but I can take 1 hour to automate this, and never have to do it again.
// Not justified? Fite me. UwU

// Do not delete this file, if not I will delete your existance.
// Sincerely, yourself.

// Database operations
require('../db')

console.log('\x1b[1m\x1b[2m[SYSTEMIC] - \x1b[1m\x1b[2mPENDING\x1b[0m: Performing integrity checks...\x1b[0m')

// Error Object
const SystemIntegrityError = new Error('\x1b[1m\x1b[31mSuccessfully repaired missing system objects. Restart the application to resume normal boot.\n\nAdditional Info: One or more system objects have been regenerated. You are receiving this warning because we failed to detect certain system objects that are required for the application to function correctly. This is most likely caused by a fresh database setup.\n\nIf this is the case, you may ignore this warning. Else, you might want to panic.\x1b[0m')

const SystemUserSchema = {
    'id': '00000000-0000-0000-0000-000000000000',
    'name': 'SYSTEM',
    'email': 'system@tourisit.local',
    'password': 'nologin',
    'ip_address': '127.0.0.1',
    'lastseen_time': new Date(),
    'is_admin': true,
    'email_status': true,
    'phone_status': true,
    'bio': 'Automated tasks and handling of the backend subsystems such as the chat.',
}

const GhostUserSchema = {
    'id': '00000000-0000-0000-0000-000000000001',
    'name': 'GHOST',
    'email': 'ghost@tourisit.local',
    'password': 'nologin',
    'ip_address': 'Heaven',
    'lastseen_time': new Date(),
    'is_admin': false,
    'email_status': true,
    'phone_status': true,
    'bio': 'Takes the place of deleted accounts.',
}

const GodUserSchema = {
    'id': '00000000-0000-0000-0000-000000000002',
    'name': 'ADMINISTRATOR',
    'email': 'administrator@tourisit.local',
    'password': 'password#123',
    'ip_address': '127.0.0.1',
    'lastseen_time': new Date(),
    'is_admin': true,
    'email_status': true,
    'phone_status': true,
    'bio': 'Built-in default administrator account.',
}

const systemUserObject = () => {
    return new Promise((res)=>{
        findDB('user', { 'id': '00000000-0000-0000-0000-000000000000' }, (result) => {
            if (result.length === 1) {
                return res(0)
            }

            insertDB('user', SystemUserSchema, () => {
                return res(1)
            })
        })
    })
}

const ghostUserObject = () => {
    return new Promise((res)=>{
        findDB('user', { 'id': '00000000-0000-0000-0000-000000000001' }, (result) => {
            if (result.length === 1) {
                return res(0)
            }

            insertDB('user', GhostUserSchema, () => {
                return res(1)
            })
        })
    })
}

const godUserObject = () => {
    return new Promise((res)=>{
        findDB('user', { 'id': '00000000-0000-0000-0000-000000000002' }, (result) => {
            if (result.length === 1) {
                return res(0)
            }

            insertDB('user', GodUserSchema, () => {
                return res(1)
            })
        })
    })
}

check = async () => {
    const mandateScore = await systemUserObject() + await godUserObject() + await ghostUserObject()

    if (mandateScore !== 0) {
        throw SystemIntegrityError
    } else {
        return console.log('\x1b[1m\x1b[2m[SYSTEMIC] - \x1b[1m\x1b[34mOK\x1b[0m: All checks succeeded.\x1b[0m')
    }
}

module.exports = { check }
