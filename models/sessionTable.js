models = require('./')

module.exports = (sequelize, DataTypes) =>{
    const Session = sequelize.define('Session', {

        sessionId: {
            allowNull: false,
            primaryKey: true,
            type: DataTypes.STRING,
        },

        // timestamp: {
        //     allowNull: false,
        //     type: DataTypes.DATE,
        // },

        // createdTimestamp: {
        //     allowNull: false,
        //     type: DataTypes.DATE,
        // },

        createdAt: {
            field: 'createdTimestamp',
            type: DataTypes.DATE,
        },

        updatedAt: {
            field: 'timestamp',
            type: DataTypes.DATE,
        },

    },


    {
        tableName: 'Session',
    })

    Session.associate = (models) => {
        Session.belongsTo(models.User, {
            foreignKey: {
                allowNull: false,
            },
        })
    }

    return Session
}
