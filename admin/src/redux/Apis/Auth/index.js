import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../configs/env";

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/auth/` }),
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (body) => ({
                url: `login`,
                method: "POST",
                body: { ...body, source: "admin" }
            }),
            transformResponse: (response, meta) => {
                meta.show_success = true
                meta.message = null
                return response;
            }
        }),
        forgetPassword: builder.mutation({
            query: (body) => ({
                url: `forgot-password`,
                method: "POST",
                body
            }),
            transformResponse: (response, meta) => {
                meta.show_success = true
                meta.message = "Verification code has been sent to your email."
                return response;
            }
        }),
        verifyCode: builder.mutation({
            query: (body) => ({
                url: `verify-otp`,
                method: "POST",
                body
            }),
            transformResponse: (response, meta) => {
                meta.show_success = true
                meta.message = "Code has been verified successfully."
                return response;
            }
        }),
        setPassword: builder.mutation({
            query: (body) => ({
                url: `reset-password`,
                method: "POST",
                body
            }),
            transformResponse: (response, meta) => {
                meta.show_success = true
                meta.message = "Password reset successfully. Please log in with your new password."
                return response;
            }
        }),
    }),
})

export const {
    useLoginMutation,
    useForgetPasswordMutation,
    useVerifyCodeMutation,
    useSetPasswordMutation
} = authApi

