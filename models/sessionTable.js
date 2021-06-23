const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class Session extends Model {
        //
    }

    Session.init(
        {
            sessionId: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
            },

            createdAt: {
                field: 'createdTimestamp',
                type: DataTypes.DATE,
            },

            updatedAt: {
                field: 'timestamp',
                type: DataTypes.DATE,
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'Session',
            modelName: 'Session',
        },
    )

    // Session.associate = (models) => {
    //     Session.belongsTo(models.User, {
    //         foreignKey: {
    //             allowNull: false,
    //         },
    //     })
    // }

    return Session
}


