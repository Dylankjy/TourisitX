const axios = require('axios')
const fetch = require('node-fetch')

function numToTime(i) {
    hours = Math.floor(i/60)
    minutes = i%60
    if (minutes == 0) {
        minutes = '0' + minutes
    }
    ampm = hours%24 < 12 ? "AM" : "PM"
    hours = hours % 12
    if (hours===0) {
        hours = 12
    }

    return `${hours}:${minutes} ${ampm}`
}

// Takes a date string and converts it to number
function timeToNum(x) {
    hours = parseInt(x.split(':')[0])
    tmp = x.split(':')[1]
    min = parseInt(tmp.split(' ')[0])
    ampm = tmp.split(' ')[1]
    hours = hours%12
    if (ampm == 'PM') {
        hours += 12
    }
    
    num = (hours * 60) + min
    return num
}


var duration = 1.5 * 60

var arr = ["7:00 AM - 8:30 AM", "3:30 PM - 5:00 PM"]
var numArr = []

function updateTime() {
    var duration = 0
    // The array of current times selected already
    var arr = []
    var numArr = []
    arr.forEach((timeRange) =>{
        start = timeRange.split(' - ')[0]
        end = timeRange.split(' - ')[1]
        console.log(`${start} - ${end}`)
        startNum = timeToNum(start)
        endNum = timeToNum(end)
        for(i = startNum; i<= endNum; i+= 30) {
            numArr.push(i)
        }
    })
        
    for(var i = 420; i < 1380 - duration; i+= 30) {
        if (numArr.includes(i) || numArr.includes(i+duration)) {
            continue
        }
        var start = numToTime(i)
        var end = numToTime(i + duration)
        // Append this to the output using jquery .append
        console.log(`${start} - ${end}`)
    }
}


arr.forEach((timeRange) =>{
    start = timeRange.split(' - ')[0]
    end = timeRange.split(' - ')[1]
    console.log(`${start} - ${end}`)
    startNum = timeToNum(start)
    endNum = timeToNum(end)
    for(i = startNum; i<= endNum; i+= 30) {
        numArr.push(i)
    }
})



var TIH_API_KEY = "GgjNvD9p8MA6c3emVYknlImLc5cAdj7X"

getAutoCompleteAPIURL = (searchStr, apiKey=TIH_API_KEY) =>{
    let AUTOCOMPLETE_API_URL = `https://tih-api.stb.gov.sg/map/v1/autocomplete/type/address?input=${searchStr}&apikey=${apiKey}`
    return AUTOCOMPLETE_API_URL
}

var APIURL = getAutoCompleteAPIURL("this",TIH_API_KEY)

axios.get(APIURL, (data)=>{
    console.log(data)
})


// fetch(getAutoCompleteAPIURL("this",TIH_API_KEY), {
//     method: "GET", 
//     headers: {"ApiEndPointTitle": "autoCompleteByType"}
// }).then(data=>console.log(data))
