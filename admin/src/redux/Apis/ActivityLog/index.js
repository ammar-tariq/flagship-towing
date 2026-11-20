import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";
import { baseQueryWithReauth } from "../../baseQueryWithReauth";

export const activityLogApi = createApi({
    reducerPath: "activityLogApi",
    baseQuery: baseQueryWithReauth(`${BASE_URL}/activity-log/`),
    endpoints: (builder) => ({
        getActivityLogs: builder.query({
            query: (params) => ({
                url: "",
                method: "GET",
                params,
            }),
        }),
    }),
})

export const { useGetActivityLogsQuery } = activityLogApi
