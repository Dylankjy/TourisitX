const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class ChatRoom extends Model {
        //
    }

    ChatRoom.init(
        {
            chatId: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
            },

            participants: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'ChatRoom',
            modelName: 'ChatRoom',
        },
    )

    return ChatRoom
}


