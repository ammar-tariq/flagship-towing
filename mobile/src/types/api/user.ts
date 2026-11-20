import type {ApiData, ApiMessage} from './common';
import type {User} from '../models/user';
import type {CreateFamilyBody, FamilyMember} from '../models/family';
import type {CreateVesselBody, Vessel} from '../models/vessel';
import type {MembershipPackage, Subscription} from '../models/membership';
import type {
  Incident,
  ServiceDetail,
  ServiceListItem,
} from '../models/service';
import type {AppContent, NotificationItem} from '../models/content';

export type ProfileResponse = ApiData<User>;

export type UpdateProfileRequest = {
  first_name: string;
  last_name: string;
  phone: string;
  picture?: string;
};

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

export type LogoutRequest = {
  /** Legacy body field */
  refresh_token?: string;
  /** Preferred body field (backend revamp) */
  refreshToken?: string;
};

export type DeleteAccountPreview = {
  has_active_membership: boolean;
  has_expired_membership?: boolean;
  active_membership_count: number;
  days_remaining: number | null;
  latest_expires_at?: string | null;
  requires_password: boolean;
};

export type DeleteAccountRequest = {
  cancelMembership?: boolean;
  confirmAccountDelete?: boolean;
  password?: string;
  confirm_email?: string;
};

export type ContactUsRequest = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type UploadImageResponse = ApiData<{path: string}>;

export type ContentResponse = ApiData<AppContent>;
export type BoatingLocationsResponse = ApiData<string[]>;

export type FamilyListResponse = ApiData<FamilyMember[]>;
export type CreateFamilyRequest = CreateFamilyBody;
export type DeleteFamilyRequest = {id: string};

export type ServicesListResponse = ApiData<ServiceListItem[]>;
export type ServiceByIdRequest = {id: string};
export type ServiceByIdResponse = ApiData<ServiceDetail>;

export type PackagesResponse = ApiData<MembershipPackage[]>;
export type PaymentLogsResponse = ApiData<{
  active_subscriptions: Subscription[];
  inactive_subscriptions: Subscription[];
}>;

export type SubscribeRequest = {
  id: string;
  vessel_id: string;
};

/** Checkout session for an existing vessel — `data.url` is the Stripe URL. */
export type SubscribeResponse = ApiMessage & {
  data?: {url?: string} | string;
};

export type CancelSubscribeRequest = Record<string, unknown>;

export type VesselListResponse = ApiData<Vessel[]>;
export type CreateVesselRequest = {
  body: CreateVesselBody;
  id: string;
};
export type CreateVesselResponse = ApiData<string> & {
  vessel_id: string;
};
export type DeleteVesselRequest = {id: string};
export type VesselPaymentStatusResponse = ApiData<{
  paid?: boolean;
  active?: boolean;
}>;

export type IncidentListResponse = ApiData<Incident[]>;
export type NotificationListResponse = ApiData<NotificationItem[]>;

export type AppleWalletRequest = {
  subscription: string;
  force?: boolean;
};
export type GoogleWalletRequest = {
  subscription: string;
};
export type WalletPassResponse = {
  success: boolean;
  data: {
    configured?: boolean;
    passUrl?: string;
    fileSize?: number;
    cached?: boolean;
    url?: string;
  };
};

export type MessageOnlyResponse = ApiMessage;
