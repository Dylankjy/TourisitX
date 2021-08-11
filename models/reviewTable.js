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
                // Customer: 'CUST', The review is about the customer, i.e. "This customer was needy and late and bad >:0"
                // Tour (guide): 'TOUR', The review is about the tour guide, i.e. "This tour was great! The guide was understanding."
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
                // '1' to '5'
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

// Reviews about how the target user is as a customer
// type: 'CUST',
// Reviews about how the target user is as a tour guide
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
