import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const notificationApi = createApi({
    reducerPath: 'notificationApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/notification/`),
    tagTypes: ['Notifications', 'UnreadCount'],
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            providesTags: ['Notifications'],
        }),
        getUnreadCount: builder.query({
            query: () => ({
                url: `unread-count`,
                method: "GET",
            }),
            providesTags: ['UnreadCount'],
        }),
        markNotificationRead: builder.mutation({
            query: (id) => ({
                url: `read/${id}`,
                method: "PATCH",
            }),
            invalidatesTags: ['Notifications', 'UnreadCount'],
        }),
        markAllNotificationsRead: builder.mutation({
            query: () => ({
                url: `read-all`,
                method: "PATCH",
            }),
            invalidatesTags: ['Notifications', 'UnreadCount'],
        }),
    }),
})

export const {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
} = notificationApi

