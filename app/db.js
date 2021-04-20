insertDB = function (db, coll, docs, callback) {
    // Get the documents collection
    const collection = db.collection(coll)
    // Insert some documents
    collection.insertMany([
        docs
    ], function (err, result) {
        if (err) throw err
        callback(result)
    })
}

updateDB = function (db, coll, query, ops, callback) {
    // Get the documents collection
    const collection = db.collection(coll)
    // Update document where a is 2, set b equal to 1
    collection.updateOne(query, ops, function (err, result) {
        if (err) throw err
        callback(result)
    })
}

findDB = function (db, coll, query, callback) {
    // Get the documents collection
    const collection = db.collection(coll)
    // Find some documents
    collection.find(query).toArray(function (err, docs) {
        if (err) throw err
        callback(docs)
    })
}

deleteDB = function (db, coll, query, callback) {
    // Get the documents collection
    const collection = db.collection(coll)
    // Find some documents
    collection.remove(query).toArray(function (err) {
        if (err) throw err
        callback(true)
    })
}

module.exports = insertDB
module.exports = updateDB
module.exports = findDB