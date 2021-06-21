models = require('.')

module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define('Token', {

        token: {
            allowNull: false,
            primaryKey: true,
            type: DataTypes.UUID,
        },

        type: {
            allowNull: false,
            type: DataTypes.STRING,
        },
    },

    {
        tableName: 'Token',
    })

    Session.associate = (models) => {
        Session.belongsTo(models.User, {
            foreignKey: {
                allowNull: false,
            },
        })
    }

    return User
}
