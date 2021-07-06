const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class Ban extends Model {
        //
    }

    Ban.init(
        {
            banId: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
            },

            // Listing/User
            banType: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING(16),
            },

            // ID of User/Listing
            objectID: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
            },

            is_inForce: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },

            createdAt: {
                field: 'createdTimestamp',
                type: DataTypes.DATE,
            },

            updatedAt: {
                field: 'updatedTimestamp',
                type: DataTypes.DATE,
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'Ban',
            modelName: 'Ban',
        },
    )

    return Ban
}


