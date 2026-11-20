import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const serviceApi = createApi({
    reducerPath: 'serviceApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/service/`),
    tagTypes: ['Services'],
    endpoints: (builder) => ({
        getServices: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            providesTags: ['Services'],
        }),
        getServiceById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET",
            }),
        }),
        createService: builder.mutation({
            query: (body) => ({
                url: `create`,
                method: "POST",
                body,
            }),
            invalidatesTags: ['Services'],
        }),
        updateService: builder.mutation({
            query: ({ id, body }) => ({
                url: `update/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ['Services'],
        }),
        deleteService: builder.mutation({
            query: (id) => ({
                url: `delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ['Services'],
        }),
    }),
})

export const {
    useGetServicesQuery,
    useGetServiceByIdQuery,
    useCreateServiceMutation,
    useUpdateServiceMutation,
    useDeleteServiceMutation,
} = serviceApi
