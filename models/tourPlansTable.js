const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class tourPlans extends Model {
        //
    }

    tourPlans.init(
        {
            planId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
            },

            bookId: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            index: {
                type: DataTypes.STRING(2),
                allowNull: false,
            },

            tourStart: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            tourEnd: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            tourPax: {
                type: DataTypes.STRING(4),
                allowNull: false,
            },

            tourPrice: {
                type: DataTypes.STRING(8),
                allowNull: false,
            },

            tourItinerary: {
                type: DataTypes.STRING(256),
                allowNull: false,
            },

            accepted: {
                type: DataTypes.STRING(2),
                allowNull: false,
                defaultValue: '0',
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'TourPlans',
            modelName: 'TourPlans',
        },
    )

    return tourPlans
}
