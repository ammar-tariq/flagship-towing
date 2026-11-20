import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const packageApi = createApi({
    reducerPath: 'packageApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/package/`),
    tagTypes: ['Packages', 'PaymentLogs'],
    endpoints: (builder) => ({
        createPackage: builder.mutation({
            query: (body) => ({
                url: `create`,
                method: "POST",
                body
            }),
            invalidatesTags: ['Packages'],
        }),
        updatePackage: builder.mutation({
            query: (body) => ({
                url: `update/${body.id}`,
                method: "PUT",
                body: body.payload
            }),
            invalidatesTags: ['Packages'],
        }),
        handleStatus: builder.mutation({
            query: (payload) => ({
                url: `handle-status/${payload.id}`,
                method: "PUT",
                body: payload.body
            }),
            invalidatesTags: ['Packages'],
        }),
        deletePackage: builder.mutation({
            query: (id) => ({
                url: `delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ['Packages'],
        }),
        getPackages: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            providesTags: ['Packages'],
        }),
        getPackageById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET",
            }),
            providesTags: ['Packages'],
        }),
        getPaymentLogs: builder.query({
            query: (params) => ({
                url: `payment-logs`,
                method: "GET",
                params
            }),
            providesTags: ['PaymentLogs'],
        }),
    }),
})

export const {
    useCreatePackageMutation,
    useUpdatePackageMutation,
    useHandleStatusMutation,
    useDeletePackageMutation,
    useGetPackagesQuery,
    useGetPackageByIdQuery,
    useGetPaymentLogsQuery
} = packageApi

