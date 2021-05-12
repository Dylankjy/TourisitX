module.exports = (sequelize, DataTypes) =>{
    const Shop = sequelize.define('Shop', {

        id: {
            allowNull: false,
            primaryKey: true,
            type: DataTypes.UUID,
        },

        userId: {
            allowNull: false,
            type: DataTypes.UUID,
        },

        tourTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        tourDesc: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        tourDuration: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        finalTimings: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        finalDays: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        finalItinerary: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        finalLocations: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        tourImage: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        tourPax: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        tourRevision: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        tourPrice: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        hidden: {
            type: DataTypes.STRING,
            allowNull: false,
        },

    },

    {
        tableName: 'Shop',
    })

    return Shop
}
