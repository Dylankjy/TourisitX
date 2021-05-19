const esClient = require('elasticsearch').Client({
    host: 'http://localhost:9200',
})

// docs is the array of documents to batch inset. index is the name of the ElasticSearch index to populate
batchIndex = (docs, esIndex) => {
    return new Promise((resolve, reject)=>{
        const body = docs.flatMap((doc) => [{ index: { _index: esIndex, _id: doc.id } }, doc])
        esClient.bulk({ refresh: true, body })
            .then((d)=>{
                resolve(d)
            })
            .catch((err)=>{
                reject(err)
            })
    })
}


updateDoc = (doc) => {
    return new Promise((resolve, reject) =>{
        esClient.update({
            index: 'products',
            id: doc['id'],
            body: {
                doc: {
                    'name': doc['name'],
                    'description': doc['description'],
                },
            },
        })
            .then((data)=>{
                resolve(data)
            })
            .catch((err)=>{
                console.log(err)
                reject(err)
            })
    })
}


updateImage = (doc) => {
    return new Promise((resolve, reject) =>{
        esClient.update({
            index: 'products',
            id: doc['id'],
            body: {
                doc: {
                    'image': doc['image'],
                },
            },
        })
            .then((data)=>{
                console.log('Updated ElasticSearch image name')
                resolve(data)
            })
            .catch((err)=>{
                console.log(err)
                reject(err)
            })
    })
}


deleteDoc = async (index, id) => {
    await esClient.delete({
        index: index,
        id: id,
    })
}


module.exports = {
    batchIndex,
    updateDoc,
    updateImage,
}
