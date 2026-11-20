import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const feedbackApi = createApi({
    reducerPath: 'feedbackApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/feedback/`),
    tagTypes: ['Feedbacks'],
    endpoints: (builder) => ({
        getFeedbacks: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            providesTags: ['Feedbacks'],
        }),
        getFeedbackById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET",
            }),
        }),
        resolveFeedback: builder.mutation({
            query: (id) => ({
                url: `resolve/${id}`,
                method: "PATCH",
            }),
            invalidatesTags: ['Feedbacks'],
        }),
    }),
})

export const {
    useGetFeedbacksQuery,
    useGetFeedbackByIdQuery,
    useResolveFeedbackMutation,
} = feedbackApi