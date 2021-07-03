const express = require('express')

const { Shop, User, Token } = require('../models')
const { Op } = require('sequelize')

const router = express.Router()

// Database operations
require('../app/db')

// Genkan API
const genkan = require('../app/genkan/genkan')
require('../app/genkan/resetPassword')

const formidable = require('express-formidable')
router.use(formidable())

// cookieParser: Cookie schema for notifications
const NotificationCookieOptions = {
    httpOnly: true,
    secure: true,
    signed: true,
    // domain: `.${config.webserver.cookieDomain}`,
    maxAge: 5000,
    path: '/',
}

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

const exampleTransaction = {
    date_paid: new Date('2011-10-05T14:48:00.000Z'),
    tour_name: 'Sex on the beach',
    cust_id: 'Takahashi Taro',
    tg_id: 'Nakamoto Yui',
    earnings: '1000',
    status: true,
}

const exampleTransaction2 = {
    date_paid: new Date('2011-10-05T14:48:00.000Z'),
    tour_name: 'City Dwelling',
    cust_id: 'Ri Ui',
    tg_id: 'Nakamoto Yui',
    earnings: '1000',
    status: false,
}


router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Admin Dashboard',
            path: false,
        },
        nav: {
            sidebarActive: 'dashboard',
        },
        layout: 'admin',
    }
    return res.render('admin/dashboard', metadata)
})

router.get('/manage/users', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }

    const pageNo = parseInt(req.query.page)

    // Data only used if, before coming to this endpoint, a user was updated.
    const notifs = req.signedCookies.notifs || 'null然シテnull然シテnull'
    const notifsData = notifs.split('然シテ') // Why 然シテ as a splitter? Because the chances of anyone using soushite in their name is 0.000001% with the fact that this is written in Katakana instead of Hiragana like any normal human being would. Why not a comma, because people like Elon Musk exists and they name their child like they are playing osu!, just that they are smashing their keyboards.

    User.findAll({ where: { 'is_admin': false }, limit: 15, offset: 0 + ((pageNo - 1) * 15) }).then( async (users) => {
        const userObjects = users.map((users) => users.dataValues)
        const totalNumberOfPages = Math.floor(await User.count({ where: { 'is_admin': false } }) / 15)

        const metadata = {
            meta: {
                title: 'Manage Users',
                path: false,
            },
            nav: {
                sidebarActive: 'users',
            },
            layout: 'admin',
            data: {
                updatedMessage: {
                    updatedUser: notifsData[1],
                    status: notifsData[0],
                    err: notifsData[2],
                },
                users: userObjects,
                pagination: {
                    firstPage: 1,
                    lastPage: totalNumberOfPages + 1,
                    previous: pageNo - 1,
                    current: pageNo,
                    next: pageNo + 1,
                },
            },
        }

        return res.render('admin/users', metadata)
    }).catch((err) => {
        throw err
    })
})

router.get('/manage/staff', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }

    const pageNo = parseInt(req.query.page)


    // Data only used if, before coming to this endpoint, a user was updated.
    const notifs = req.signedCookies.notifs || 'null然シテnull然シテnull'
    const notifsData = notifs.split('然シテ') // Read above for why this is soushite

    User.findAll({ where: { 'is_admin': true }, limit: 15, offset: 0 + ((pageNo - 1) * 15) }).then(async (users) => {
        const userObjects = users.map((users) => users.dataValues)
        const totalNumberOfPages = Math.floor(await User.count({ where: { 'is_admin': true } }) / 15)

        const metadata = {
            meta: {
                title: 'Manage Staff',
                path: false,
            },
            nav: {
                sidebarActive: 'staff',
            },
            layout: 'admin',
            data: {
                updatedMessage: {
                    updatedUser: notifsData[1] || undefined,
                    status: notifsData[0],
                    err: notifsData[2],
                },
                users: userObjects,
                pagination: {
                    firstPage: 1,
                    lastPage: totalNumberOfPages + 1,
                    previous: pageNo - 1,
                    current: pageNo,
                    next: pageNo + 1,
                },
            },
        }
        return res.render('admin/staff', metadata)
    }).catch((err) => {
        throw err
    })
})

router.get('/manage/users/edit/:userId', (req, res) => {
    const targetUserId = req.params.userId

    genkan.getUserByID(targetUserId, (user) => {
        if (user === null) {
            return res.render('404', { layout: 'admin' })
        }

        // Data only used if, before coming to this endpoint, a user was updated.
        const notifs = req.signedCookies.notifs || 'null然シテnull然シテnull'
        const notifsData = notifs.split('然シテ') // Read above for why this is soushite

        const metadata = {
            meta: {
                title: 'Edit User: ' + user.name,
                path: false,
            },
            nav: {
                sidebarActive: 'users',
            },
            layout: 'admin',
            data: {
                user: user,
                updatedMessage: {
                    updatedUser: notifsData[1] || undefined,
                    status: notifsData[0],
                    err: notifsData[2],
                },
            },
        }

        if (user.id.includes('00000000-0000-0000-0000-0000000000') === true) {
            metadata.data.readonly = true
        }

        if (user.is_admin === true) {
            metadata.data.previousPage = 'staff'
            metadata.nav.sidebarActive = 'staff'
        } else {
            metadata.data.previousPage = 'users'
            metadata.nav.sidebarActive = 'users'
        }

        res.render('admin/edit/user', metadata)
    })
})

router.post('/manage/users/edit/:userId', (req, res) => {
    const targetUserId = req.params.userId

    genkan.getUserByID(targetUserId, (user) => {
        let redirectTo = 'users'

        if (user === null) {
            res.cookie('notifs', `ERR_UPDATEDUSER然シテ${user.name}然シテTarget user does not exist. このユーザーは存在しません。`, NotificationCookieOptions)
            return res.redirect('/admin/manage/' + redirectTo)
        }

        // For administrative action buttons
        if (req.fields.editingPortion === 'ADMIN_ACTIONS') {
            const requestedAction = req.fields.actionDo
            if (requestedAction === 'CONFIRM_EMAIL') {
                return updateDB('user', { id: targetUserId }, { email_status: true }, () => {
                    Token.destroy({
                        where: {
                            'userId': targetUserId,
                        },
                    }).catch((err) => {
                        throw err
                    })

                    res.cookie('notifs', `OK_EMAILCONFIRMED然シテ${user.name}`, NotificationCookieOptions)
                    return res.redirect('/admin/manage/' + redirectTo)
                })
            }
            if (requestedAction === 'SEND_RECOVERY_EMAIL') {
                return sendResetPasswordEmail(user.email, () => {
                    res.cookie('notifs', `OK_SENDRECOVEREMAIL然シテ${user.name}`, NotificationCookieOptions)
                    return res.redirect('/admin/manage/' + redirectTo)
                })
            }
            if (requestedAction === 'DELETE_USER') {
                return User.destroy({
                    where: {
                        'id': targetUserId,
                    },
                }).catch((err) => {
                    throw err
                }).then(() => {
                    res.cookie('notifs', `OK_DELETED然シテ${user.name}`, NotificationCookieOptions)
                    return res.redirect('/admin/manage/' + redirectTo)
                })
            }

            // Reject everything else.
            return false
        }

        const EditUserPayload = {
            'account_mode': req.fields.account_mode,
            'name': req.fields.name,
            'bio': req.fields.bio,
            'email': req.fields.email,
            'phone_number': req.fields.phone_number,
            'fb': req.fields.fb,
            'insta': req.fields.insta,
            'li': req.fields.li,
        }

        User.findAll({
            where: {
                [Op.not]: {
                    id: targetUserId,
                },
                email: req.fields.email,
            },
        }).then((data) => {
            if (data.length !== 0) {
                res.cookie('notifs', `ERR_DUPLICATEEMAIL然シテ${req.fields.name}`, NotificationCookieOptions)
                return res.redirect('/admin/manage/users/edit/' + targetUserId)
            }

            if (user.is_admin === true) {
                redirectTo = 'staff'
            } else {
                redirectTo = 'users'
            }

            User.update(EditUserPayload, {
                where: { 'id': targetUserId },
            }).catch((err) => {
                res.cookie('notifs', `ERR_UPDATEDUSER然シテ${req.fields.name}然シテ${err}`, NotificationCookieOptions)
                return res.redirect('/admin/manage/' + redirectTo)
            }).then((data) => {
                res.cookie('notifs', `OK_UPDATEDUSER然シテ${req.fields.name}`, NotificationCookieOptions)
                return res.redirect('/admin/manage/' + redirectTo)
            })
        }).catch((err)=> {
            throw err
        })
    })
})

router.get('/manage/tours', (req, res) => {
    Shop.findAll(
        {
            where: {
                // Set to empty now, but it should be replaced with the userID when authentication library is out
                userId: 'sample',
            },
            order:
                [['createdAt', 'ASC']],
        },
    )
        .then(async (data)=>{
            const listings = []
            await data.forEach((doc)=>{
                listings.push(doc['dataValues'])
            })

            const metadata = {
                meta: {
                    title: 'Manage Tours',
                    path: false,
                },
                nav: {
                    sidebarActive: 'tourListings',
                },
                layout: 'admin',
                listing: listings,
            }
            return res.render('admin/listings', metadata)
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})

router.get('/payments', (req, res) => {
    const metadata = {
        meta: {
            title: 'Payments',
            path: false,
        },
        nav: {
            sidebarActive: 'payments',
        },
        layout: 'admin',
        data: {
            transactions: { exampleTransaction, exampleTransaction2 },
        },
    }
    return res.render('admin/payments', metadata)
})


router.get('/tickets', (req, res) => {
    const metadata = {
        meta: {
            title: 'Support Tickets',
            path: false,
        },
        nav: {
            sidebarActive: 'tickets',
        },
        layout: 'admin',
    }
    return res.render('admin/tickets', metadata)
})

module.exports = router
