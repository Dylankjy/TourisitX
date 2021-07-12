$(document).on('turbolinks:load', () => {
    // Force bottom of chat history
    $('#message-container-display').scrollTop($('#message-container-display')[0].scrollHeight)

    const socket = io.connect({ 'forceNew': true })

    let sendIdCounter = 0

    console.log('[INIT] 開始中')
    socket.on('connect', () => {
        socket.emit('room', $('#currentChatID').val())
        console.log('[START] 接続が成功しました.')
    })

    $('#messageBoxInput').keydown((e) => {
        if (e.keyCode == 13) {
            // The reason why the message payload is separate from the append is for sanitary reason.
            $('#message-container-display').append(`
                <p id="pending-${sendIdCounter}" class="message-bubble send sending mt-3"></p>
            `)

            $(`#pending-${sendIdCounter}`).text($('#messageBoxInput').val())

            socket.emit('msgSend', { msg: $('#messageBoxInput').val(), roomId: $('#currentChatID').val(), senderId: $('#currentUserID').val(), pendingCount: sendIdCounter })
            $('#messageBoxInput').val('')

            $('#message-container-display').scrollTop($('#message-container-display')[0].scrollHeight)

            // Increment the send counter
            sendIdCounter++
        }
    })

    socket.on('msgReceive', (data) => {
        if (data.senderId === $('#currentUserID').val()) {
            $(`#pending-${data.pendingCount}`).removeClass('sending')
        } else {
            // Sanitisation is handled by the server
            $('#message-container-display').append(`
                <p class="message-bubble receive mt-3">${data.msg}</p>
            `)

            $('#message-container-display').scrollTop($('#message-container-display').scrollHeight)
        }
    })

    socket.on('reloginRequired', () => {
        window.location.replace('/id/login?required=1')
    })

    socket.emit('room', $('#currentChatID').val())

    $(document).on('turbolinks:before-cache turbolinks:before-render', () => {
        console.log('[END] 接続を切りました')
        return socket.disconnect()
    })
})
