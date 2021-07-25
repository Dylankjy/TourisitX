const config = require("../config/apikeys.json")
const cardValidator = require('card-validator')


const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)


var userParams = {
    "email": "mymail@nyp.test.com",
    "name": "Bezoos",
}

createPaymentMethod = async () => {
    params = {
        type: "card"
    }
    var resp = await stripe.paymentMethods.create(params)
    console.log(resp)
}

createStripeCustomer = async (userParams) => {
    var resp = await stripe.customers.create(userParams)
    console.log(resp["id"])
}

var stripeUserId = "cus_JuY4gtWmUGEt6k"
var stripeTokenId = "tok_1JGjFaG1eRiRVhCZTn3NM2Wo"

retrieveStripeCustomer = async (stripeUserId) => {
    var customerData = await stripe.customers.retrieve(stripeUserId)
    console.log(customerData)
}

var cardParam = {
    card: {
        number: "4242 4242 4242 4242",
        exp_month: 3,
        exp_year: 2024,
        cvc: "213"
    }
}

createStripeToken = async (cardParam) => {
    var token = await stripe.tokens.create(cardParam)
    console.log(token)
}


addCardtoCustomer = async (stripeUserId, stripeTokenId) => {
    const tokenIdSource = {source: stripeTokenId}
    var resp = await stripe.customers.createSource(stripeUserId, tokenIdSource)
    console.log(resp)
}

var chargeParam = {
    amount: "2000", 
    currency: "sgd",
    description: "Tour Name blah", 
    customer: stripeUserId
}
chargeCustomer = async (chargeParam) => {
    var resp = await stripe.charges.create(chargeParam)
    console.log(resp)
}


stripe.customers.create(userParams)
.then((data)=>{
    console.log(data["id"])
}).catch((err)=>{
    console.log(err)
})

// var resp = cardValidator.number('4242424242424242')
// console.log(cardValidator.expirationDate("10/21"))
    
// }