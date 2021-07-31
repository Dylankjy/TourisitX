const { Shop, User } = require('../models')

// Config file
const config = require('../config/apikeys.json')


const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)


test = async () => {
    // const accountId = 'acct_1JIpirQCkAaMeH0J'
    const accountId = 'acct_1JIqLZ4d8ixHsDug'
    const account = await stripe.accounts.retrieve(
        accountId,
    )
    console.log(account.payouts_enabled)
}

test()
