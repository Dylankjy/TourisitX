
const { default: axios } = require('axios')
const { Shop } = require('../models')

const elasticSearchHelper = require('../app/elasticSearch')
const esClient = elasticSearchHelper.esClient


esClient.indices.exists({ index: 'products' }).then((data)=>{
    console.log(data)
})
