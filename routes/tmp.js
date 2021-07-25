const { Shop, User } = require("../models");

// Config file
const config = require('../config/apikeys.json')


const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)


test = async () => {
  var itemData = await Shop.findAll({
    where: {
        id: "332f5448-aed0-492e-b287-0fba9dffdedd"
    },
    raw: true
  })
  
  var savedUserData = await User.findAll({
    where: {
        id: "2a84c8e0-ecf5-11eb-9840-a31b685bb3e4"
    },
    raw: true
  })
  
  itemData = itemData[0]
  savedUserData = savedUserData[0]
  
  const session = await stripe.checkout.sessions.create({
    payment_intent_data: {
        setup_future_usage: 'off_session',
    },
    customer: savedUserData["stripe_id"],
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'sgd',
          product_data: {
            name: itemData["tourTitle"],
          },
          unit_amount: itemData["tourPrice"] * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'https://example.com/success.html',
    cancel_url: 'https://example.com/cancel.html',
  });

  console.log(session)
}

test()
