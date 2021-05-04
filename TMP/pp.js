const axios = require('axios')

var searchStr = 'raf'
var apiKey = 'GgjNvD9p8MA6c3emVYknlImLc5cAdj7X'
var AUTOCOMPLETE_API_URL = `https://tih-api.stb.gov.sg/map/v1/autocomplete/type/address?input=${searchStr}&apikey=${apiKey}`

axios.get(AUTOCOMPLETE_API_URL)
.then((data)=>{
console.log(data)
})