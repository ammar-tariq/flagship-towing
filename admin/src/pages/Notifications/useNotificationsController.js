import { useNavigate } from "react-router-dom"
import {
    useGetNotificationsQuery,
    useMarkAllNotificationsReadMutation,
    useMarkNotificationReadMutation,
} from "../../redux/Apis/Notification"

const useNotificationsController = () => {

    const navigate = useNavigate()
    const { data, isLoading } = useGetNotificationsQuery()
    const [markRead] = useMarkNotificationReadMutation()
    const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation()

    const notificationPath = (item) => {
        const n = item?.notification
        if (!n) return undefined
        let payload = n?.data
        if (typeof payload === "string") {
            try {
                payload = JSON.parse(payload)
            } catch {
                payload = undefined
            }
        }
        return payload?.admin_panel_route || n?.admin_panel_route
    }

    const onNotificationClick = (item) => {
        const id = item?._id ?? item?.id
        const path = notificationPath(item)
        // Navigate first so the UI never waits on the PATCH (slow/hanging requests felt "not clickable").
        if (path) {
            navigate(path)
        }
        if (id) {
            void markRead(id).unwrap().catch(() => {})
        }
    }

    const onMarkAllRead = () => {
        markAllRead()
    }

    return {
        values: {
            data: data?.data || [],
            isLoading,
            isMarkingAll,
        },
        functions: {
            onNotificationClick,
            onMarkAllRead,
        },
    }
}

export default useNotificationsController