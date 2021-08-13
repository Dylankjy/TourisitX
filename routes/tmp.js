const { Shop, User, Review } = require('../models')

// Config file
const config = require('../config/apikeys.json')


const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const id = 'acct_1JNZVT4e3RKFRugX'

payout = async () => {
    // const accountId = 'acct_1JIpirQCkAaMeH0J'
    const transfer = await stripe.transfers.create({
        amount: 6000 * 100,
        currency: 'sgd',
        destination: id,
        description: 'this is working',
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

viewTransfers = async () => {
    accId = 'acct_1JNZVT4e3RKFRugX'
    const account = await stripe.accounts.retrieve(
        'acct_1JNZVT4e3RKFRugX',
    )
    // const payouts = await stripe.payouts.list({})
    bankAccId = account['external_accounts']['data'][0]['id']

    const transfers = await stripe.transfers.list({
        destination: accId,
    })
    console.log(transfers)
}

test = async () => {
    accId = 'acct_1JNZVT4e3RKFRugX'
    const link = await stripe.accounts.createLoginLink(accId)
    console.log(link)
}

t = async () => {
    const itemId = 'eff68494-225d-4c87-a6af-de5a6fa572a6'

    const tourReviews = await Review.findAll({
        where: {
            'tourId': itemId,
            'type': 'TOUR',
        },
        include: [{ model: User, as: 'Reviewer' }],
        raw: true,
    })

    console.log(tourReviews[0]['Reviewer.name'])
}

t()
