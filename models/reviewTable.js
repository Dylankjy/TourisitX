const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class Review extends Model {
        //
    }

    Review.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
            },

            type: {
                type: DataTypes.STRING(4),
                allowNull: false,
                // Customer: 'CUST', Tour (guide): 'TOUR'
            },

            reviewerId: {
                // ID of user leaving the review
                type: DataTypes.UUID,
                allowNull: false,
            },

            subjectId: {
                // ID of user being reviewed
                type: DataTypes.UUID,
                allowNull: false,
            },

            tourId: {
                // ID of the tour
                type: DataTypes.UUID,
                allowNull: false,
            },

            bookId: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            reviewText: {
                type: DataTypes.STRING(256),
                allowNull: true,
            },

            rating: {
                type: DataTypes.STRING(1),
                allowNull: false,
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'Review',
            modelName: 'Review',
        },
    )

    Review.associate = (models) => {
        Review.belongsTo(models.User, {
            targetKey: 'id',
            foreignKey: 'reviewerId',
        })

        Review.belongsTo(models.User, {
            targetKey: 'id',
            foreignKey: 'subjectId',
        })

        Review.belongsTo(models.Shop, {
            targetKey: 'id',
            foreignKey: 'tourId',
        })

        Review.belongsTo(models.Booking, {
            targetKey: 'bookId',
            foreignKey: 'bookId',
        })
    }

    return Review
}

// The relations are in, so you should be able to fetch all the reviews under a Tour / User, by including it in your query. Else, you can:

// When querying for all a user's reviews (both as a guide and customer)
// where: {
//     subjectId: userId,
// },

// As a customer
// type: 'CUST',
// As a guide
// type: 'TOUR',

// When querying for all reviews under a tour
// where: {
//     type: 'TOUR',
//     tourId: tourId,
// },

// When querying for all reviews written by a user
// where: {
//     reviewerId: userId,
// },

// How do you comfort a JavaScript bug?
// You console it!
