// Express.js
const express = require('express')
const router = express.Router()

// Genkan Middleware
const { adminAuthorisationRequired, loginRequired } = require('../app/genkan/middleware')

// // Database Operations
// const { 

// // Admin Panel API
// router.get('/admin/api', (req, res) => {

// })

module.exports = router
