import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {API_BASE_URL} from './baseQuery';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SignupRequest,
  SignupResponse,
  SocialLoginRequest,
  SocialLoginResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@Types/api/auth';
import type {UploadImageResponse} from '@Types/api/user';

/** Auth endpoints are unauthenticated (except we don't need Bearer on login). */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: headers => {
      headers.set('Accept', 'application/json');
      // Leave Content-Type unset so FormData uploads get a multipart boundary.
      return headers;
    },
  }),
  endpoints: builder => ({
    signup: builder.mutation<SignupResponse, SignupRequest>({
      query: body => ({
        url: '/auth/signup',
        method: 'POST',
        body,
      }),
    }),
    /** Public signup avatar upload (no Bearer). */
    uploadSignupImage: builder.mutation<UploadImageResponse, FormData>({
      query: body => ({
        url: '/general/upload-signup-image',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: body => ({
        url: `/auth/login`,
        method: 'POST',
        body,
      }),
    }),
    socialLogin: builder.mutation<SocialLoginResponse, SocialLoginRequest>({
      query: body => ({
        url: `/auth/social-login`,
        method: 'POST',
        body,
      }),
    }),
    forgotPassword: builder.mutation<
      ForgotPasswordResponse,
      ForgotPasswordRequest
    >({
      query: body => ({
        url: `/auth/forget-password`,
        method: 'POST',
        body,
      }),
    }),
    verify: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: body => ({
        url: `/auth/verify-otp`,
        method: 'POST',
        body,
      }),
    }),
    setPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      query: body => ({
        url: `/auth/reset-password`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useSignupMutation,
  useUploadSignupImageMutation,
  useLoginMutation,
  useSocialLoginMutation,
  useForgotPasswordMutation,
  useVerifyMutation,
  useSetPasswordMutation,
} = authApi;
