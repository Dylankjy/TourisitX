// This file is completely utterly useless and it is here to be fancy.
const puns = require('puns.dev')

console.log(`\x1b[1m\x1b[32m
 _______               _     _ _  __   __
|__   __|             (_)   (_) | \\ \\ / /
   | | ___  _   _ _ __ _ ___ _| |_ \\ V / 
   | |/ _ \\| | | | '__| / __| | __| > <  
   | | (_) | |_| | |  | \\__ \\ | |_ / . \\
   |_|\\___/ \\__,_|_|  |_|___/_|\\__/_/ \\_\\ \x1b[0m
`)

const thePun = puns.random()
console.log('Here is a pun while the app initialises:')
console.log(thePun['pun'] + '\n' + thePun['punchline'])
