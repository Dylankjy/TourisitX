// UUID & Hashing
const uuid = require('uuid')
const sha512 = require('hash-anything').sha512

tokenGenerator = () => {
    // Generate and return (sync) random sha512 string
    return sha512({
        a: `${uuid.v5(uuid.v4(), uuid.v5(uuid.v4(), uuid.v4()))}-${uuid.v5(uuid.v4(), uuid.v5(uuid.v4(), uuid.v4()))}-${uuid.v5(uuid.v4(), uuid.v5(uuid.v4(), uuid.v4()))}`,
        b: uuid.v5(uuid.v5(uuid.v4(), uuid.v4()), uuid.v5(uuid.v4(), uuid.v4())) + (new Date()).toISOString(),
    })
}

module.exports = tokenGenerator
