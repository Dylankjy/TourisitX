router.get('/es-api/create-index', (req, res)=>{
    const searchText = req.query.text
    esClient.indices.create({
        index: 'products',
        id: req.fields.id,
        body: {
            'settings': {
                // SPECIFY ALL THE CUSTOM FILTERS AND ANALYZERS HERE
                'analysis': {
                    // Specify custom filters here
                    'filter': {
                        // Will generate n-grams from the words {E.g "shirt --> "sh", "shi", "shir", "shirt"}
                        'autocomplete_filter': {
                            'type': 'ngram',
                            'min_gram': '3',
                            'max_gram': '4',
                        },
                    },
                    // Specify custom analyzers here
                    'analyzer': {
                        'autocomplete': {
                            'filter': ['lowercase', 'autocomplete_filter'],
                            'type': 'custom',
                            'tokenizer': 'whitespace',
                        },
                    },
                },
            },
            // Define the mappings here
            'mappings': {
                // Define the field mapppings here
                'properties': {
                    'name': {
                        'type': 'text',
                        // Define the custom analyzers here (This is run everytime a new data is added)
                        'analyzer': 'autocomplete',
                    },
                    'description': {
                        'type': 'text',
                        'index': 'false',
                    },
                    'image': {
                        'type': 'text',
                        'index': 'false',
                    },
                },
            },
            // 'index':{
            //     "similarity": {
            //         "name_similarity": {
            //             "type": ""
            //         }
            //     }
            // }
        },
    })
        .then((data)=>{
            return res.json({ 'Message': 'Indexing Successful' })
        })
        .catch((err)=>{
            console.log(err)
            return res.status(500).json({ 'Message': 'Error' })
        })
})


router.post('/es-api/upload', (req, res) => {
    esClient.index({
        index: 'products',
        // Need to define the ID here so you can update using ID
        id: req.fields.id,
        body: {
            'name': req.fields.name,
            // "id": req.fields.id,
            'description': req.fields.description,
            'image': req.fields.image,
            // "suggest": {
            //     input: req.fields.name.split(' '),
            // },
            // "output": req.fields.name
        },
    })
        .then((data)=>{
            console.log('Indexed!')
            return res.json({ 'Message': 'Indexing successful' })
        })
        .catch((err)=>{
            console.log(err)
        })
})


router.post('/es-api/update', (req, res) => {
    esClient.update({
        index: 'products',
        id: req.fields.id,
        body: {
            doc: {
                'name': req.fields.name,
                // "id": req.fields.id,
                'description': req.fields.description,
                'image': req.fields.image,
            },
        },
    })
        .then((data)=>{
            console.log('Updated!')
            return res.json({ 'Message': 'Update successful' })
        })
        .catch((err)=>{
            console.log(err)
        })
})


router.get('/es-api/delete', (req, res) => {
    esClient.indices.delete({
        index: 'products',
    })
        .then((data)=>{
            console.log('Deleted!')
            return res.json({ 'Message': 'Delete successful' })
        })
        .catch((err)=>{
            console.log(err)
        })
})


router.get('/es-api/search', (req, res) => {
    const searchText = req.query.text
    esClient.search({
        index: 'products',
        body: {
            'query': {
                'match': {
                    // Specify the 'name' field to be matched against the searchText
                    'name': searchText,
                },
            },
            'sort': ['_score'],
        },
    })
        .then((data)=>{
            return res.json(data)
        })
        .catch((err)=>{
            console.log(err)
            return res.status(500).json({ 'Message': 'Error' })
        })
})


router.get('/es-api/suggest', (req, res) => {
    const searchText = req.query.text
    esClient.search({
        index: 'products',
        body: {
            suggest: {
                gotsuggest: {
                    text: searchText,
                    term: { field: 'name' },
                },
            },
        },
    })
        .then((data)=>{
            console.log('Ran suggester')
            return res.json(data)
        })
        .catch((err)=>{
            return res.status(500).json({ 'Message': 'Error' })
        })
})


// To generate fake entries to test out elastic search
router.get('/es-api/dev/generateFakes', (req, res) => {
    const noToGenerate = req.query.num
    const fakes = []
    for (let i = 0; i <= noToGenerate; i ++) {
        fakes.push(generateFakeEntry())
    }

    const body = fakes.flatMap((doc) => [{ index: { _index: 'products' } }, doc])
    esClient.bulk({ refresh: true, body })
        .then((d)=>{
            console.log(d)
            res.json({ 'Message': 'Success' })
        })
        .catch((err)=>{
            console.log(err)
            res.json(err)
        })
})

// docs is the array of documents to batch inset. index is the name of the ElasticSearch index to populate
// batchIndex = (docs, esIndex) => {
//     return new Promise((resolve, reject)=>{
//         const body = docs.flatMap((doc) => [{ index: { _index: esIndex } }, doc])
//         esClient.bulk({ refresh: true, body })
//             .then((d)=>{
//                 resolve(d)
//             })
//             .catch((err)=>{
//                 reject(err)
//             })
//     })
// }

// To populate the elastic search index using the Shop Database
router.get('/es-api/getFromShopDB', async (req, res) => {
    await axios('http://localhost:5000/listing/es-api/delete')
    await axios('http://localhost:5000/listing/es-api/create-index')
    // This array will contain all the JSON objects
    const docs = []
    // Specify the attributes to retrieve
    Shop.findAll({ attributes: ['id', ['tourTitle', 'name'], ['tourDesc', 'description'], ['tourImage', 'image']] })
        .then((data)=>{
            data.forEach((doc)=>{
            // console.log(doc["Shop"]["dataValues"])
                docs.push(doc['dataValues'])
            })

            elasticSearchHelper.batchIndex(docs, 'products')
                .then((data)=>{
                    res.json({ 'Message': 'Success', 'data': docs })
                })
                .catch((err)=>{
                    console.log(err)
                    res.json({ 'Message': 'Failed to populate ElasticSearch from SQL' })
                })
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Error Querying from SQL' })
        })
})


// To initialize the elastic search client for the first time
router.get('/es-api/initFromDB', async (req, res) => {
    await axios('http://localhost:5000/listing/es-api/create-index')
    // This array will contain all the JSON objects
    const docs = []
    // Specify the attributes to retrieve
    Shop.findAll({ attributes: ['id', ['tourTitle', 'name'], ['tourDesc', 'description'], ['tourImage', 'image']] })
        .then((data)=>{
            data.forEach((doc)=>{
            // console.log(doc["Shop"]["dataValues"])
                docs.push(doc['dataValues'])
            })

            elasticSearchHelper.batchIndex(docs, 'products')
                .then((data)=>{
                    res.json({ 'Message': 'Success', 'data': docs })
                })
                .catch((err)=>{
                    console.log(err)
                    res.json({ 'Message': 'Failed to populate ElasticSearch from SQL' })
                })
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Error Querying from SQL' })
        })
})
