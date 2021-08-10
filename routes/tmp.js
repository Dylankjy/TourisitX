const { Shop, User } = require('../models')

// Config file
const config = require('../config/apikeys.json')


const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const id = 'acct_1JIqrc4fL5hixuop'

payout = async () => {
    // const accountId = 'acct_1JIpirQCkAaMeH0J'
    const transfer = await stripe.transfers.create({
        amount: 6000 * 100,
        currency: 'sgd',
        destination: id,
    })

    console.log(transfer)
}

test = async () => {
    const invoices = await stripe.charges.list({
        limit: 3,
    })

    console.log(invoices["data"])
}

test()
