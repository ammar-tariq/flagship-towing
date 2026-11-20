const mongoose = require('mongoose')
const socketController = require('../controllers/socket.controller')

const connectDatabase = async (dbName, connectionString) => {
    try {
        await mongoose.connect(connectionString, {
            dbName,
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log("Database connected successfully!")
    } catch (e) {
        console.log("Error while connecting to Database", e)
    }
}

const connectSocket = async (io) => {
    try {

        io.on('connection', async (socket) => {
            try {
                const token = socket.handshake.query.token
                if (!token) {
                    socket.disconnect(true)
                    return
                }

                const { verifyAccessToken } = require('../helpers/token')
                const User = require('../models/user.model')
                const decoded = await verifyAccessToken(token)
                const user = await User.findById(decoded.id).select('token_version active').lean()
                if (!user || !user.active || (decoded.tv ?? 0) !== (user.token_version || 0)) {
                    socket.disconnect(true)
                    return
                }

                socket.user_id = decoded.id
                console.log("Socket Connection Successfully Created", socket.id, socket.user_id)
                socketController(socket, io)

                socket.on('disconnect', () => {
                    console.log('Socket Connection Successfully Disconnected', socket.id)
                })
            } catch (e) {
                console.log('Socket auth failed', e.message)
                socket.disconnect(true)
            }
        })

    } catch (e) {
        console.log("Error while connecting to Sockets", e)
    }
}

module.exports = {
    connectDatabase,
    connectSocket
}