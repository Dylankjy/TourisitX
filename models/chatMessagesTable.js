const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class ChatMessages extends Model {
        //
    }

    ChatMessages.init(
        {
            messageId: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
            },

            messageText: {
                field: 'messageText',
                allowNull: false,
                type: DataTypes.STRING(2000),
            },

            flag: {
                field: 'flag',
                allowNull: false,
                defaultValue: 'SENT',
                type: DataTypes.STRING(8), // SENT, DELETED, EMBED
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'ChatMessages',
            modelName: 'ChatMessages',
        },
    )

    return ChatMessages
}


