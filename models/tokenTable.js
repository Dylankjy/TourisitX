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
                type: DataTypes.STRING(512),
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

    return Token
}
