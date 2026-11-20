import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const vesselsApi = createApi({
    reducerPath: 'vesselsApi',
    tagTypes: ['Vessels', 'Vessel'],
    baseQuery: baseQueryWithReauth(`${BASE_URL}/vessel/`),
    endpoints: (builder) => ({
        getVessels: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map((v) => ({ type: 'Vessel', id: v._id })),
                        { type: 'Vessels', id: 'LIST' },
                    ]
                    : [{ type: 'Vessels', id: 'LIST' }],
        }),
        getVesselById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET"
            }),
            providesTags: (result, error, id) => [{ type: 'Vessel', id }],
        }),
        deleteVessel: builder.mutation({
            query: (id) => ({
                url: `delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: 'Vessels', id: 'LIST' }],
        }),
        updateVessel: builder.mutation({
            query: ({ id, payload }) => ({
                url: `update/${id}`,
                method: "PATCH",
                body: payload,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Vessel', id },
                { type: 'Vessels', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                try {
                    const { data: res } = await queryFulfilled
                    const updated = res?.data
                    if (!updated) return
                    dispatch(
                        vesselsApi.util.updateQueryData('getVesselById', id, (draft) => {
                            if (draft?.data) {
                                Object.assign(draft.data, updated)
                            }
                        })
                    )
                } catch {
                    // invalidatesTags still refetches on failure paths
                }
            },
        }),
    }),
})

export const {
    useGetVesselsQuery,
    useGetVesselByIdQuery,
    useUpdateVesselMutation,
    useDeleteVesselMutation,
} = vesselsApi
