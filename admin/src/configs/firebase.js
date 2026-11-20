import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { VAPID_KEY } from "./env"
import toast from "react-hot-toast"

const requireEnv = (name) => {
    const value = String(import.meta.env[name] || "").trim()
    if (!value) {
        throw new Error(
            `Missing ${name}. Copy adminFlagship/.env.example to .env and set it.`,
        )
    }
    return value
}

const firebaseConfig = {
    apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("VITE_FIREBASE_APP_ID"),
    measurementId: requireEnv("VITE_FIREBASE_MEASUREMENT_ID"),
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

export const requestForToken = async () => {
    try {
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
        })
        if (token) {
            return token
        } else {
            console.log("No registration token available. Request permission to generate one.")
        }
    } catch (error) {
        console.error("Error getting FCM token:", error)
    }
}

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            const { title, body } = payload.notification
            toast.info(`${title}: ${body}`, {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            resolve(payload)
        })
    })