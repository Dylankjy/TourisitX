const elasticSearch = require('elasticsearch')

const esClient = elasticSearch.Client({
    host: "http://localhost:9909"
})

// Deletes an index from the Elastic Search node (An index here can be likened to a database table)
deleteIndex = () => {  
    return esClient.indices.delete({
        index: "products"
    });
}


// Creates an index
createIndex = () => {  
    return esClient.indices.create({
        index: "products"
    });
}


// To initialize the mapping (Define the data it will store, types, etc)
initMapping = () => {  
    return esClient.indices.putMapping({
        include_type_name: true,
        index: "products",
        type: "document",
        body: {
            properties: {
                name: {type: "text"},
                description: {type: "text"},
                image: {type: "text"},
                // Define the suggestion function
                suggest: {
                    type: "completion",
                    analyzer: "simple",
                    search_analyzer: "simple",
                }
            }
        }
    });
}


addDocument = (document) => {  
    return esClient.index({
        index: "products",
        type: "document",
        body: {
            name: document.name,
            description: document.description,
            image: document.image,
            // Define the suggestion criteria.
            suggest: {
                // I will split the words in the title. So, when I type one of these words (or part of this word), I will be suggested the tour title
                input: document.name.split(" "),
                // Suggest the title 
                output: document.title
            }
        }
    });
}


// getSuggestions = (input) => {  
//     return esClient.search({
//         index: "products",
//         type: "document",
//         body: {
//             docsuggest: {
//                 text: input,
//                 completion: {
//                     field: "suggest",
//                     fuzzy: true
//                 }
//             }
//         }
//     })
}   


// deleteIndex()
// .then((data)=>{
//     console.log("Deleted Index")
// })
// .catch((err)=>{
//     console.log(err)
// })

// createIndex()
// .then((data)=>{
//     console.log("Created Index")
// })
// .catch((err)=>{
//     console.log(err)
// })


initMapping()
.then((data)=>{
    console.log("Initialized mappings")
})
.catch((err)=>{
    console.log(err)
})

var prods = [
    {
        name: "Blues of the Bishan", 
        description: "See the sights of singapore",
        image: "default.jpg"
    },
    {
        name: "Raffles Night Life", 
        description: "Attractive lights by the bay",
        image: "raffles.jpg"
    },
    {
        name: "Sentosa caves ", 
        description: "Explore the dark caves of the island",
        image: "sent.jpg"
    }
]


addDocument({
    name: "Blues of the Bishan", 
    description: "See the sights of singapore",
    image: "default.jpg"
})
.then((data)=>{
    console.log("Added data")
})
.catch((err)=>{
    console.log(err)
})


getSuggestions("bi")
.then((data)=>{
    console.log(data)
})
.catch((err)=>{
    console.log(err)
})

