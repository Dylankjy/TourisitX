const elasticSearch = require('elasticsearch')

const esClient = elasticSearch.Client({
    host: "http://localhost:9909"
})


router.get('/es-api/create-index', (req, res)=>{
    var searchText = req.query.text
    esClient.indices.create({
        index: "products",
        body: {
            "settings": {
                // SPECIFY ALL THE CUSTOM FILTERS AND ANALYZERS HERE
                "analysis": {
                    // Specify custom filters here
                    "filter": {
                        // Will generate n-grams from the words {E.g "shirt --> "sh", "shi", "shir", "shirt"}
                        "autocomplete_filter": {
                            "type": "edge_ngram",
                            "min_gram": "1",
                            "max_gram": "40"
                        }
                    },
                    // Specify custom analyzers here
                    "analyzer": {
                        "autocomplete": {
                            "filter": ["lowercase", "autocomplete_filter"],
                            "type": "custom",
                            "tokenizer": "whitespace"
                        }
                    }
                },
                // Define the mappings here
                "mappings": {
                    // Define the field mapppings here
                    "properties": {
                        "name": {
                            "type": "text",
                            // Define the custom analyzers here (This is run everytime a new data is added)
                            "analyzer": "autocomplete"

                        },
                        "description": {
                            "type": "text",
                            "index": "false"
                        },
                        "image": {
                            "type": "text",
                            "index": "false"
                        }
                    }
                }
            }
        }
    })
})


router.get('/es-api/search', (req, res) => {
    const searchText = req.query.text
    esClient.search({
        index: "products",
        body: {
            "query": {
                "match":{
                    // Specify the 'name' field to be matched against the searchText
                    "name": searchText
                }
            }
        }
    })
})



// router.get('/es-api/search', (req, res) => {
//     const searchText = req.query.text
//     esClient.search({
//         index: "products",
//         body: {
//             query: {
//                 fuzzy: {
//                     name : {
//                         value: searchText.trim(),
//                         fuzziness: 5,
//                         prefix_length: 0
//                     }
//                 },
//                 match: {
//                     name: searchText
//                 }
//             },
//             suggest: {
//                 text: searchText,
//                 gotsuggest: {
//                     term: {
//                         field: 'name',
//                         // https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html
//                         analyzer: 'standard',
//                         // Max of 3 corrections per suggest text
//                         size: 3,
//                         // Sort the suggestions by score (Can set to 'frequency' too)
//                         sort: 'score',
//                         // Suggestion_mode
//                         // suggest_mode: 'always'
//                         // Set to 0, so that even if my first character in word is wrong, it will still suggest 
//                         prefix_length: 0
//                     }
//                 },
//                 autoSuggest: {
//                     prefix: searchText, 
//                     completion: {
//                         field: 'suggest',
//                         fuzzy: {
//                             fuzziness: "auto"
//                         }
//                     }
//                 },
//                 phaseSuggest: {
//                     phase: {
//                         field: "name.trigram",
//                         size: 1,
//                         gram_size: 3,
//                     }
//                 }

//             }
//         }
//     })
//     .then((data)=>{
//         console.log("Ran")
//         return res.json(data)
//     })
//     .catch((err)=>{
//         return res.status(500).json({"Message": "Error"})
//     })
// })

