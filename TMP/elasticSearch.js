const elasticSearch = require('elasticsearch')

const esClient = elasticSearch.Client({
    host: "http://localhost:9909"
})


router.get('/es-api/search', (req, res) => {
    const searchText = req.query.text
    esClient.search({
        index: "products",
        body: {
            query: {
                fuzzy: {
                    name : {
                        value: searchText.trim(),
                        fuzziness: 5,
                        prefix_length: 0
                    }
                },
                match: {
                    name: searchText
                }
            },
            suggest: {
                text: searchText,
                gotsuggest: {
                    term: {
                        field: 'name',
                        // https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html
                        analyzer: 'standard',
                        // Max of 3 corrections per suggest text
                        size: 3,
                        // Sort the suggestions by score (Can set to 'frequency' too)
                        sort: 'score',
                        // Suggestion_mode
                        // suggest_mode: 'always'
                        // Set to 0, so that even if my first character in word is wrong, it will still suggest 
                        prefix_length: 0
                    }
                },
                autoSuggest: {
                    prefix: searchText, 
                    completion: {
                        field: 'suggest',
                        fuzzy: {
                            fuzziness: "auto"
                        }
                    }
                },
                phaseSuggest: {
                    phase: {
                        field: "name.trigram",
                        size: 1,
                        gram_size: 3,
                    }
                }

            }
        }
    })
    .then((data)=>{
        console.log("Ran")
        return res.json(data)
    })
    .catch((err)=>{
        return res.status(500).json({"Message": "Error"})
    })
})

