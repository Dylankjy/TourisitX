$(document).on('turbolinks:load', () => {
    if (!$('#thisIsABookingPageSoPleaseLoadTheChatScript').length) {
        return
    }

    const socket = io.connect({ 'forceNew': true })

    let sendIdCounter = 0

    console.log('[INIT] 開始中')
    socket.on('connect', () => {
        socket.emit('room', $('#currentChatID').val())
        console.log('[START] 接続が成功しました.')
    })

    $('#sendMessageBtn').click(() => {
        // The reason why the message payload is separate from the append is for sanitary reason.
        // Sanitisation is handled by the server
        $('#timeline-container').append(`
        <div id="pending-${sendIdCounter}" class="timeline-item sending">
            <div class="timeline-marker is-icon has-background-success has-text-white">
                <i class="fas fa-comment"></i>
            </div>
            <div class="timeline-content">
                <p class="has-text-weight-semibold">You sent a message:</p>
                <p id="message-text"></p>
            </div>
        </div>
        `)

        $(`#pending-${sendIdCounter} #message-text`).text($('#messageToSendInput').val())

        socket.emit('msgSend', { msg: $('#messageToSendInput').val(), roomId: $('#currentChatID').val(), senderId: $('#currentUserID').val(), pendingCount: sendIdCounter })

        $('#messageToSendInput').val('')

        // Increment the send counter
        sendIdCounter++
    })

    socket.on('msgReceive', (data) => {
        if (data.senderId === $('#currentUserID').val()) {
            console.log(`[RECEIVE] ${data.senderId} がメッセージを送信しました.`)
            $(`#pending-${data.pendingCount}`).removeClass('sending')
        } else {
            // Sanitisation is handled by the server
            $('#timeline-container').append(`
            <div class="timeline-item">
                <div class="timeline-marker is-icon has-background-success has-text-white">
                    <i class="fas fa-comment"></i>
                </div>
                <div class="timeline-content">
                    <p class="has-text-weight-semibold">${data.senderName} sent a message:</p>
                    <p>${data.msg}</p>
                </div>
            </div>
            `)
        }
    })

    socket.on('reloginRequired', () => {
        window.location.replace('/id/login?required=1')
    })

    $(document).on('turbolinks:before-cache turbolinks:before-render', () => {
        if (!$('#thisIsABookingPageSoPleaseLoadTheChatScript').length) {
            return
        }
        console.log('[END] 接続を切りました')
        return socket.disconnect()
    })
})
