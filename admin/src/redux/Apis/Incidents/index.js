import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const incidentsApi = createApi({
    reducerPath: 'incidentsApi',
    baseQuery: baseQueryWithReauth(`${BASE_URL}/incident/`),
    endpoints: (builder) => ({
        createIncident: builder.mutation({
            query: (body) => ({
                url: `create`,
                method: "POST",
                body
            }),
        }),
        getIncidents: builder.query({
            query: (params) => ({
                url: `get`,
                method: "GET",
                params
            }),
            keepUnusedDataFor: 0
        }),
        getIncidentById: builder.query({
            query: (id) => ({
                url: `get/${id}`,
                method: "GET",
            }),
        }),
        deleteIncident: builder.mutation({
            query: (id) => ({
                url: `delete/${id}`,
                method: "DELETE",
            }),
        }),
        updateIncident: builder.mutation({
            query: ({ id, body }) => ({
                url: `update/${id}`,
                method: "PATCH",
                body,
            }),
        }),
    }),
})

export const {
    useCreateIncidentMutation,
    useGetIncidentsQuery,
    useGetIncidentByIdQuery,
    useDeleteIncidentMutation,
    useUpdateIncidentMutation,
} = incidentsApi