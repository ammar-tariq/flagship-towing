import {createApi} from '@reduxjs/toolkit/query/react';
import {DEVELOPMENT, PRODUCTION} from '@Lib/configs/apiEndpoints';
import {baseQueryWithReauth, API_BASE_URL} from './baseQuery';
import type {
  AppleWalletRequest,
  BoatingLocationsResponse,
  CancelSubscribeRequest,
  ChangePasswordRequest,
  ContactUsRequest,
  ContentResponse,
  CreateFamilyRequest,
  CreateVesselRequest,
  CreateVesselResponse,
  DeleteAccountPreview,
  DeleteAccountRequest,
  DeleteFamilyRequest,
  DeleteVesselRequest,
  FamilyListResponse,
  GoogleWalletRequest,
  IncidentListResponse,
  LogoutRequest,
  MessageOnlyResponse,
  NotificationListResponse,
  PackagesResponse,
  PaymentLogsResponse,
  ProfileResponse,
  ServiceByIdRequest,
  ServiceByIdResponse,
  ServicesListResponse,
  SubscribeRequest,
  SubscribeResponse,
  UpdateProfileRequest,
  UploadImageResponse,
  VesselListResponse,
  VesselPaymentStatusResponse,
  WalletPassResponse,
} from '@Types/api/user';
import type {ApiData} from '@Types/api/common';
import type {User} from '@Types/models/user';
import type {FamilyMember} from '@Types/models/family';
import type {CreateVesselBody, Vessel} from '@Types/models/vessel';

export const BASE_URL = API_BASE_URL;
export const IMAGE_BASE_URL = __DEV__
  ? DEVELOPMENT.imageBaseUrl
  : PRODUCTION.imageBaseUrl;

const CONTENT_CACHE_SEC = 600;
const LIST_CACHE_SEC = 300;
const PROFILE_CACHE_SEC = 300;
const NOTIFICATION_CACHE_SEC = 90;

export const userApi = createApi({
  reducerPath: 'userApi',
  refetchOnFocus: false,
  // Soft stale-while-revalidate: reuse cache, refetch if older than 30s
  refetchOnMountOrArgChange: 30,
  refetchOnReconnect: true,
  keepUnusedDataFor: 180,
  tagTypes: [
    'Content',
    'Profile',
    'Family',
    'Services',
    'Packages',
    'Vessel',
    'Incident',
    'Notifications',
    'PaymentLogs',
  ],
  baseQuery: baseQueryWithReauth,
  endpoints: builder => ({
    getProfile: builder.query<ProfileResponse, void>({
      query: () => `/user/my-profile`,
      keepUnusedDataFor: PROFILE_CACHE_SEC,
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<ApiData<User>, UpdateProfileRequest>({
      query: body => ({
        url: `/user/update`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
    changePassword: builder.mutation<MessageOnlyResponse, ChangePasswordRequest>(
      {
        query: body => ({
          url: `/user/change-password`,
          method: 'POST',
          body,
        }),
      },
    ),
    logout: builder.mutation<MessageOnlyResponse, LogoutRequest | void>({
      query: body => ({
        url: `/user/logout`,
        method: 'POST',
        body: body || {},
      }),
    }),
    getDeletePreview: builder.query<ApiData<DeleteAccountPreview>, void>({
      query: () => `/user/delete-preview`,
    }),
    deleteAccount: builder.mutation<
      MessageOnlyResponse,
      DeleteAccountRequest | void
    >({
      query: (body?: DeleteAccountRequest) => ({
        url: `/user/delete`,
        method: 'POST',
        body: body || {},
      }),
    }),
    contactUs: builder.mutation<MessageOnlyResponse, ContactUsRequest>({
      query: body => ({
        url: `/feedback/create`,
        method: 'POST',
        body,
      }),
    }),
    aboutus: builder.query<ApiData<unknown>, void>({
      query: () => `/about_app`,
      keepUnusedDataFor: CONTENT_CACHE_SEC,
      providesTags: ['Content'],
    }),
    terms: builder.query<ApiData<unknown>, void>({
      query: () => `/terms_and_conditions`,
      keepUnusedDataFor: CONTENT_CACHE_SEC,
      providesTags: ['Content'],
    }),
    privacyPolicy: builder.query<ApiData<unknown>, void>({
      query: () => `/privacy_policy`,
      keepUnusedDataFor: CONTENT_CACHE_SEC,
      providesTags: ['Content'],
    }),
    uploadImage: builder.mutation<UploadImageResponse, FormData>({
      query: body => ({
        url: `/general/upload-image`,
        method: 'POST',
        body,
      }),
    }),

    getContent: builder.query<ContentResponse, void>({
      query: () => `/general/get-content`,
      keepUnusedDataFor: CONTENT_CACHE_SEC,
      providesTags: ['Content'],
    }),
    getBoatingLocations: builder.query<BoatingLocationsResponse, void>({
      query: () => `/general/boating-locations`,
      keepUnusedDataFor: 3600,
    }),

    getFamily: builder.query<FamilyListResponse, void>({
      query: () => `/family/get`,
      keepUnusedDataFor: PROFILE_CACHE_SEC,
      providesTags: ['Family'],
    }),
    createFamily: builder.mutation<ApiData<FamilyMember>, CreateFamilyRequest>({
      query: body => ({
        url: `/family/create`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Family'],
    }),
    deleteFamily: builder.mutation<MessageOnlyResponse, DeleteFamilyRequest>({
      query: ({id}) => ({
        url: `/family/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Family'],
    }),

    getServices: builder.query<ServicesListResponse, void>({
      query: () => `/service/get`,
      keepUnusedDataFor: LIST_CACHE_SEC,
      providesTags: ['Services'],
    }),
    getServiceById: builder.query<ServiceByIdResponse, ServiceByIdRequest>({
      query: ({id}) => `/service/get/${id}`,
      keepUnusedDataFor: LIST_CACHE_SEC,
      providesTags: (_result, _error, {id}) => [{type: 'Services', id}],
    }),

    getPackages: builder.query<PackagesResponse, void>({
      query: () => `/package/get?active=true`,
      keepUnusedDataFor: LIST_CACHE_SEC,
      providesTags: ['Packages'],
    }),
    getPaymentLogs: builder.query<PaymentLogsResponse, void>({
      query: () => `/package/payment-logs`,
      keepUnusedDataFor: LIST_CACHE_SEC,
      providesTags: ['PaymentLogs'],
    }),
    subscribe: builder.mutation<SubscribeResponse, SubscribeRequest>({
      query: ({id, vessel_id}) => ({
        url: `/package/subscribe/${id}`,
        method: 'POST',
        body: {vessel_id},
      }),
      invalidatesTags: ['Packages', 'PaymentLogs', 'Profile'],
    }),
    cancelSubscribe: builder.mutation<
      MessageOnlyResponse,
      CancelSubscribeRequest
    >({
      query: body => ({
        url: `/package/cancel`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentLogs', 'Profile'],
    }),

    getVessel: builder.query<VesselListResponse, void>({
      query: () => `/vessel/get`,
      keepUnusedDataFor: PROFILE_CACHE_SEC,
      providesTags: ['Vessel'],
    }),
    getVesselPaymentStatus: builder.query<
      VesselPaymentStatusResponse,
      string
    >({
      query: (id: string) => `/vessel/payment-status/${id}`,
      keepUnusedDataFor: 60,
    }),
    createVessel: builder.mutation<CreateVesselResponse, CreateVesselRequest>({
      query: ({body, id}) => ({
        url: `/vessel/create/${id}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Vessel', 'Profile'],
    }),
    deleteVessel: builder.mutation<MessageOnlyResponse, DeleteVesselRequest>({
      query: ({id}) => ({
        url: `/vessel/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vessel', 'Profile'],
    }),
    updateVessel: builder.mutation<
      ApiData<Vessel>,
      {id: string; body: Partial<CreateVesselBody>}
    >({
      query: ({id, body}) => ({
        url: `/vessel/update/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Vessel', 'Profile'],
    }),

    getIncident: builder.query<IncidentListResponse, void>({
      query: () => `/incident/get`,
      keepUnusedDataFor: LIST_CACHE_SEC,
      providesTags: ['Incident'],
    }),

    getNotificationList: builder.query<NotificationListResponse, void>({
      query: () => `/notification/get`,
      keepUnusedDataFor: NOTIFICATION_CACHE_SEC,
      providesTags: ['Notifications'],
    }),

    getAppleWalletPass: builder.mutation<
      WalletPassResponse,
      AppleWalletRequest
    >({
      query: ({subscription, force = false}) => ({
        url: `/wallet/apple`,
        method: 'POST',
        body: {subscription, force},
      }),
    }),
    getGoogleWalletPass: builder.mutation<
      WalletPassResponse,
      GoogleWalletRequest
    >({
      query: ({subscription}) => ({
        url: `/wallet/google`,
        method: 'POST',
        body: {subscription},
      }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useAboutusQuery,
  useTermsQuery,
  usePrivacyPolicyQuery,
  useUploadImageMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useContactUsMutation,
  useGetContentQuery,
  useGetBoatingLocationsQuery,
  useLogoutMutation,
  useLazyGetDeletePreviewQuery,
  useDeleteAccountMutation,

  useGetFamilyQuery,
  useCreateFamilyMutation,
  useDeleteFamilyMutation,

  useGetServicesQuery,
  useGetServiceByIdQuery,

  useGetPackagesQuery,
  useSubscribeMutation,
  useGetPaymentLogsQuery,
  useCancelSubscribeMutation,

  useGetVesselQuery,
  useLazyGetVesselPaymentStatusQuery,
  useCreateVesselMutation,
  useDeleteVesselMutation,
  useUpdateVesselMutation,

  useGetIncidentQuery,

  useGetNotificationListQuery,

  useGetAppleWalletPassMutation,
  useGetGoogleWalletPassMutation,
} = userApi;
