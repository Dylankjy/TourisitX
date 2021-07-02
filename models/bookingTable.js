const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class Booking extends Model {
        //
    }

    Booking.init(
        {
            bookId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
            },

            custId: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            tgId: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            listingId: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            chatId: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            orderDatetime: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            tourStart: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            tourEnd: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            bookPax: {
                type: DataTypes.STRING(4),
                allowNull: true,
            },

            bookDuration: {
                // stored in seconds, 12h = 43200
                type: DataTypes.STRING(5),
                allowNull: true,
            },

            bookBaseprice: {
                type: DataTypes.STRING(8),
                allowNull: false,
            },

            bookCharges: {
                // array of additional charges
                type: DataTypes.STRING(256),
                allowNull: true,

            },

            processStep: {
                type: DataTypes.STRING(1),
                allowNull: false,
                defaultValue: 0,
            },

            revisions: {
                // number of revisions left
                type: DataTypes.STRING(4),
                allowNull: false,
                defaultValue: 0,
            },

            addInfo: {
                type: DataTypes.STRING(256),
                allowNull: true,
            },

            custRequests: {
                //  array containing customer requirements and revision requests
                type: DataTypes.STRING(2000),
                allowNull: true,
            },

            completed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            approved: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'Booking',
            modelName: 'Booking',
        },
    )

    return Booking
}
