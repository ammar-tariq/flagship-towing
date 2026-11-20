import type {ApiData, ApiMessage} from './common';
import type {User} from '../models/user';

export type LoginRequest = {
  email: string;
  password: string;
  source: string;
  device_id: string;
};

export type SignupRequest = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  picture?: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type ResetPasswordRequest = {
  email: string;
  password: string;
};

export type SocialLoginRequest = Record<string, unknown>;

/** Dual-read during backend migration: legacy `token`/`refresh_token` + new `accessToken`/`refreshToken`. */
export type AuthTokensResponse = {
  token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  tokenType?: 'Bearer';
  expiresIn?: number;
  message?: string;
};

export type AuthSessionResponse = AuthTokensResponse & {
  data: User;
};

export type LoginResponse = AuthSessionResponse;
export type SocialLoginResponse = AuthSessionResponse;
export type SignupResponse = ApiMessage | ApiData<User>;
export type ForgotPasswordResponse = ApiMessage;
export type VerifyOtpResponse = ApiMessage;
export type ResetPasswordResponse = ApiMessage;

export function pickAccessToken(payload?: AuthTokensResponse | null): string | null {
  return payload?.accessToken ?? payload?.token ?? null;
}

export function pickRefreshToken(
  payload?: AuthTokensResponse | null,
): string | null {
  return payload?.refreshToken ?? payload?.refresh_token ?? null;
}
