const config = require("../config/apikeys.json")
const cardValidator = require('card-validator')


const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY


const stripe = require('stripe')(STRIPE_SECRET_KEY)


var userParams = {
    "email": "werewre@ere.fer",
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


createPayout = async (amt) => {
    const payout = await stripe.payouts.create({
        amount: amt*100,
        currency: 'sgd',
        destination: "000123456"
    });

    console.log(payout)
}


viewBalance = async () => {
    stripe.balance.retrieve(function(err, balance) {
        console.log(balance)
    });
}

addBankAcc = async () => {
    const source = {
        object: 'bank_account',
        country: 'SG',
        currency: 'sgd',
        routing_number: '1100-000',
        account_number: '000123456'
    }


    const bankAccount = await stripe.customers.createSource(
        'cus_JuoDlpsygwIlPB',
        {source: source}
    );
    console.log(bankAccount)
}

// addBankAcc()

// Payout to seller account
// stripe.transfers.create({
//     amount: 10 * 1000,
//     currency: "sgd",
//     destination: "acct_1JHIw4QAjLjpblZf",
//   }).then((data)=>{
//     console.log(data)
// })

stripe.topups.create({
    amount: 2000,
    currency: 'usd',
    description: 'Top-up for week of May 31',
    statement_descriptor: 'Weekly top-up',
  }).then((data)=>{
      console.log(data)
  })


// var resp = cardValidator.number('4242424242424242')
// console.log(cardValidator.expirationDate("10/21"))
    
// }