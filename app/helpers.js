// Takes in a response from router. Message to show users if they are not logged in
requireLogin = (res) => {
    console.log('Pls log in')
    res.redirect('/id/login')
}

// Message to show users if they lack permission (I.e Not the owner of the listing)
requirePermission = (res) =>{
    return res.send('No perms')
}

// remove all null elements
removeNull = (arr) => {
    return arr.filter((n) => n)
}

// Returns true if array empty, else return false
emptyArray = (arr) => {
    return arr.filter((n) => n).length == 0
}

// Removes a given element with val from array arr
removeFromArray = (val, arr) => {
    return arr.filter((elem)=>{
        return elem != val
    })
}


getUserfromSid = async (sid) => {
    if (sid == null) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
    // Redirect to login page
        return requireLogin(res)
    }

    const userData = await genkan.getUserBySessionAsync(sid)
    return userData
}


module.exports = {
    requireLogin,
    requirePermission,
    removeNull,
    emptyArray,
    removeFromArray,
}
