const { ChatRoom } = require('../models')
const chat = require('../app/chat/chat')
const { Op } = require('sequelize')

a = async () => {
    const tourGuideId = '1ac140a0-ec55-11eb-9654-4f78fedafb73'
    const adminID = '00000000-0000-0000-0000-000000000000'
    const revokeMessage = 'THis is revoed'

    const chatData = await ChatRoom.findAll(
        {
            where: {
                participants: {
                    [Op.like]: `%${tourGuideId}%${adminID}%`,
                },
            },
        },
        (raw = true),
    )

    const chatRoomID = chatData[0]['chatId']
    console.log('THIS IS CHAT ROOM ID' + chatRoomID)
    console.log(revokeMessage)
    chat.addMessage(chatRoomID, 'SYSTEM', revokeMessage, 'SENT', () => {})
}

a()
