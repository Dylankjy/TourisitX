removeFromArray = (val, arr) => {
    return arr.filter((elem)=>{
        return elem != val
    });
}

x = "one;!;two;!;three;!;"
x = x.split(";!;")
console.log(x)

x = removeFromArray("two", x)
x = removeFromArray("one", x)
x = removeFromArray("three", x)
x = x.join(";!;")
console.log(`x is :${x}`)

