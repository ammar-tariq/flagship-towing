import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const promoApi = createApi({
    reducerPath: 'promoApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/promo/`),
    tagTypes: ['Promos'],
    endpoints: (builder) => ({
        createPromo: builder.mutation({
            query: (body) => ({
                url: `create`,
                method: "POST",
                body
            }),
            invalidatesTags: ['Promos'],
        }),
        updatePromo: builder.mutation({
            query: ({ id, payload }) => ({
                url: `update/${id}`,
                method: "PATCH",
                body: payload,
            }),
            invalidatesTags: ['Promos'],
        }),
        handleStatus: builder.mutation({
            query: (body) => ({
                url: `handle-status/${body?.id}`,
                method: "PATCH",
                body: body?.payload
            }),
            invalidatesTags: ['Promos'],
        }),
        getPromos: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            providesTags: ['Promos'],
        }),
        getPromoById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET",
            }),
        })
    }),
})

export const {
    useHandleStatusMutation,
    useCreatePromoMutation,
    useUpdatePromoMutation,
    useGetPromosQuery,
    useGetPromoByIdQuery
} = promoApi