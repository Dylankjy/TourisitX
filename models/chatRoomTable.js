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

            bookingId: {
                allowNull: true,
                type: DataTypes.UUID,
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


