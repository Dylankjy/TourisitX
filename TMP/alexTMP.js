// for(var i = 1; i < 11.5; i+= 0.5) {
//     console.log(`${i}`)           
// }

// Takes number (minutes) and returns a string
// Takes 420 and returns 7am
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
    var duration = 
    // The array of current times selected already
    var arr = 
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

console.log(numArr)

for(var i = 420; i < 1380 - duration; i+= 30) {
    if (numArr.includes(i) || numArr.includes(i+duration)) {
        continue
    }
    var start = numToTime(i)
    var end = numToTime(i + duration)
    console.log(`${start} - ${end}`)
}

