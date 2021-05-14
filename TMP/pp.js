var x = "werwer,Go to the chopper;!; at bshan an eat some duck rice"
x = x.split(',')
x = x.map(e=>e.replace(';!;', ','))

console.log(x)


