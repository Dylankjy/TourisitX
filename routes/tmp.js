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

listCharges = async () => {
    const invoices = await stripe.charges.list({
        limit: 3,
    })

    console.log(invoices['data'])
}


transactionHistory = async () => {
    const paymentIntents = await stripe.paymentIntents.list({
        customer: 'cus_JwkMh0iAeKGWgj',
    })

    console.log(paymentIntents['data'][0]['charges']['data'])
    // console.log(paymentIntents['data'][0]['charges']['data'][0]['receipt_url'])
}

test = async () => {
    const account = await stripe.accounts.retrieve(
        'acct_1JIqrc4fL5hixuop',
    )
    // const payouts = await stripe.payouts.list({})
    bankAccId = account['external_accounts']['data'][0]['id']
    console.log(bankAccId)
    const payouts = await stripe.payouts.list({
        destination: bankAccId,
    })

    console.log(payouts)
    // ba_1JIr1S4fL5hixuopkp0e86Ad
}

test()
