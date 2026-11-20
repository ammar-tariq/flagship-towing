const socket = require("socket.io")
const dotenv = require('dotenv')
dotenv.config()

const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://flagship-towing.projectstagingzone.com',
]
const corsConfigured = Boolean(process.env.CORS_ORIGINS)
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

let _io;

const setIO = (server) => {
    _io = socket(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true)
                if (!corsConfigured) return callback(null, true)
                if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                    return callback(null, true)
                }
                return callback(null, false)
            },
            credentials: true,
        }
    })
    return _io
}

const getIO = () => {
    return _io
}

module.exports = {
    getIO,
    setIO
}
