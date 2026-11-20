import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const representativeApi = createApi({
    reducerPath: 'representativeApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/representative/`),
    tagTypes: ['Representatives'],
    endpoints: (builder) => ({
        createRepresentative: builder.mutation({
            query: (body) => ({
                url: `create`,
                method: "POST",
                body
            }),
            invalidatesTags: ['Representatives'],
        }),
        updateRepresentative: builder.mutation({
            query: ({ id, payload }) => ({
                url: `update/${id}`,
                method: "PATCH",
                body: payload
            }),
            invalidatesTags: ['Representatives'],
        }),
        deleteRepresentative: builder.mutation({
            query: (id) => ({
                url: `delete/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ['Representatives'],
        }),
        handleStatus: builder.mutation({
            query: (body) => ({
                url: `handle-status/${body?.id}`,
                method: "PATCH",
                body: body?.payload
            }),
            invalidatesTags: ['Representatives'],
        }),
        getRepresentatives: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            providesTags: ['Representatives'],
        }),
        getRepresentativeById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET",
            }),
        })
    }),
})

export const {
    useHandleStatusMutation,
    useCreateRepresentativeMutation,
    useUpdateRepresentativeMutation,
    useDeleteRepresentativeMutation,
    useGetRepresentativesQuery,
    useGetRepresentativeByIdQuery
} = representativeApi