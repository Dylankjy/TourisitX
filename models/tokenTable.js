const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class Token extends Model {
        //
    }

    Token.init(
        {
            token: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
            },

            type: {
                allowNull: false,
                type: DataTypes.STRING(16),
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'Token',
            modelName: 'Token',
        },
    )

    // Token.associate = (models) => {
    //     Token.belongsTo(models.User, {
    //         foreignKey: {
    //             allowNull: false,
    //         },
    //     })
    // }

    return Token
}
