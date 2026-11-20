import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const generalApi = createApi({
    reducerPath: 'generalApi',
    tagTypes: ["AppSettings"],
    baseQuery: baseQueryWithReauth(`${BASE_URL}/general/`),
    endpoints: (builder) => ({
        getBoatingLocations: builder.query({
            query: () => ({
                url: `boating-locations`,
                method: "GET",
            }),
        }),
        getAppSettings: builder.query({
            query: () => ({
                url: `app-settings`,
                method: "GET",
            }),
            providesTags: ["AppSettings"],
        }),
        patchAppSettings: builder.mutation({
            query: (body) => ({
                url: `app-settings`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["AppSettings"],
        }),
        uploadImage: builder.mutation({
            query: (formData) => ({
                url: `upload-image`,
                method: "POST",
                body: formData,
            }),
        }),
    }),
})

export const {
    useGetBoatingLocationsQuery,
    useGetAppSettingsQuery,
    usePatchAppSettingsMutation,
    useUploadImageMutation,
} = generalApi