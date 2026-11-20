import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/user/`),
    tagTypes: ['Users'],
    endpoints: (builder) => ({
        createUser: builder.mutation({
            query: (body) => ({
                url: `create`,
                method: "POST",
                body
            }),
            invalidatesTags: ['Users'],
        }),
        handleStatus: builder.mutation({
            query: (body) => ({
                url: `handle-status/${body?.id}`,
                method: "PATCH",
                body: body?.payload
            }),
            invalidatesTags: ['Users'],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `delete/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ['Users'],
        }),
        getUsers: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            providesTags: ['Users'],
        }),
        getUserById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET",
            }),
            providesTags: (result, error, id) => [{ type: 'Users', id }],
        }),
        updateUser: builder.mutation({
            query: ({ id, payload }) => ({
                url: `admin-update/${id}`,
                method: "PATCH",
                body: payload,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Users', id }, 'Users'],
        }),
        exportUsers: builder.query({
            query: (params) => ({
                url: "export",
                method: "GET",
                params,
                responseHandler: async (response) => {
                    const blob = await response.blob()
                    return blob
                },
            }),
        }),
        getDeletedAccounts: builder.query({
            query: (params) => ({
                url: "deleted-accounts",
                method: "GET",
                params,
            }),
        }),
        importSheetUsers: builder.mutation({
            query: (formData) => ({
                url: "import-sheet",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ['Users'],
        }),
    }),
})

export const {
    useCreateUserMutation,
    useUpdateUserMutation,
    useHandleStatusMutation,
    useDeleteUserMutation,
    useGetUsersQuery,
    useGetUserByIdQuery,
    useLazyExportUsersQuery,
    useGetDeletedAccountsQuery,
    useImportSheetUsersMutation,
} = userApi
