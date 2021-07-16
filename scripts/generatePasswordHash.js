const config = require('../config/genkan.json')
// UUID & Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')
const saltRounds = 12

// Change this to your desired password.
const passwordToHash = 'HelloWorld123'

// SHA512 Hashing
const hashedPasswordSHA512 = sha512({
    a: passwordToHash,
    b: config.genkan.secretKey,
})

// Bcrypt Hashing
const hashedPasswordSHA512Bcrypt = bcrypt.hashSync(hashedPasswordSHA512, saltRounds)

console.log(hashedPasswordSHA512Bcrypt)
