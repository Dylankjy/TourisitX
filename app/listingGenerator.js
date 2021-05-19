const uuid = require('uuid')
const random = require('random')
const textgen = require('txtgen')
const randomWords = require('random-words')


generateFakeEntry = () => {
    const id = uuid.v4()
    const name = textgen.sentence()
    const desc = textgen.paragraph(3)
    const image = `${randomWords()}.jpg`

    const fakeData = {
        'id': id,
        'name': name,
        'description': desc,
        'image': image,
    }

    return fakeData
}


module.exports = {
    generateFakeEntry,
}
