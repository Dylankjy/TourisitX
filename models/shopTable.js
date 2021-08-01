const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class Shop extends Model {
        //
    }

    Shop.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
            },

            userId: {
                allowNull: false,
                type: DataTypes.UUID,
            },

            tourTitle: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },

            tourDesc: {
                type: DataTypes.STRING(2048),
                allowNull: false,
            },

            tourDuration: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },

            finalTimings: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },

            finalDays: {
                type: DataTypes.STRING(128),
                allowNull: false,
            },

            finalItinerary: {
                type: DataTypes.STRING(256),
                allowNull: false,
            },

            finalLocations: {
                type: DataTypes.STRING(128),
                allowNull: false,
            },

            tourImage: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },

            tourPax: {
                type: DataTypes.STRING(4),
                allowNull: false,
            },

            tourRevision: {
                type: DataTypes.STRING(4),
                allowNull: false,
            },

            tourPrice: {
                type: DataTypes.STRING(8),
                allowNull: false,
            },

            hidden: {
                type: DataTypes.STRING(8),
                allowNull: false,
            },

        },

        {
            sequelize,
            tableName: 'Shop',
        },
    )


    Shop.associate = (models) => {
        Shop.hasMany(models.Booking, {
            onDelete: 'cascade',
            sourceKey: 'id',
            foreignKey: 'listingId',
        })

        Shop.hasMany(models.Review, {
            onDelete: 'cascade',
            sourceKey: 'id',
            foreignKey: 'tourId',
        })
    }

    return Shop
}
