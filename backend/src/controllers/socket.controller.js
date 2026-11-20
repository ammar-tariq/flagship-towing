const Conversation = require('../models/conversation.model')

const socketController = (socket, io) => {

    socket.on('join', async (payload) => {
        try {
            const conversationId = payload?.conversation
            if (!conversationId || !socket.user_id) {
                return
            }

            const conversation = await Conversation.findById(conversationId)
                .select('user vendor participants')
                .lean()

            if (!conversation) {
                return
            }

            const uid = String(socket.user_id)
            const allowedIds = [
                conversation.user,
                conversation.vendor,
                ...(conversation.participants || []),
            ]
                .filter(Boolean)
                .map((id) => String(id._id || id))

            if (!allowedIds.includes(uid)) {
                console.log(`Socket join denied for user ${uid} room ${conversationId}`)
                return
            }

            console.log(`Joining room :: ${conversationId}`)
            socket.join(conversationId)
        } catch (e) {
            console.log('Socket join error :: ', e.message)
        }
    })

    socket.on('message', async (payload) => {
        if (!socket.user_id || !payload?.conversation) {
            return
        }

        // Only emit if socket has joined the room (authorized via join)
        const rooms = socket.rooms
        if (!rooms.has(payload.conversation)) {
            return
        }

        console.log(`Received message from ${socket.id}`)

        const data = {
            conversation: payload.conversation,
            sender: socket.user_id,
            message: payload.message,
        }

        io.to(payload.conversation).emit('message', {
            ...data,
            sender: {
                _id: socket.user_id,
            },
            id: socket.id,
            createdAt: new Date(),
        })
    })
}

module.exports = socketController
