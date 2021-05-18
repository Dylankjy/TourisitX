const uuid = require('uuid')
const random = require('random')
const textgen = require('txtgen')
const randomWords = require('random-words')


generateFakeEntry = () => {
   var id = uuid.v4()
    var name = textgen.sentence()
    var desc = textgen.paragraph(3)
    var image = `${randomWords()}.jpg`

    var fakeData = {
        "id": id,
        "name": name,
        "description": desc,
        "image": image
    } 

    return fakeData
}


module.exports = {
    generateFakeEntry
}
