import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const familyMembersApi = createApi({
    reducerPath: 'familyMembersApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/family/`),
    endpoints: (builder) => ({
        getFamilyMembers: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
        }),
        getFamilyMemberById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET",
            }),
        }),
        getFamilyCount: builder.query({
            query: (data) => ({
                url: `get-count/${data?.id}`,
                method: "GET",
                params: data?.params
            }),
        }),
        updateStatus: builder.mutation({
            query: (payload) => ({
                url: `handle-status/${payload.id}`,
                method: "PATCH",
                body: payload.payload
            }),
        }),
    }),
})

export const {
    useGetFamilyMembersQuery,
    useGetFamilyMemberByIdQuery,
    useGetFamilyCountQuery,
    useUpdateStatusMutation
} = familyMembersApi