/**
 * Normalize API / RTK errors into Formik field errors + optional toast.
 * Prefer server `errors` object; fall back to message heuristics.
 */

import type {FormikHelpers} from 'formik';
import Toast from 'react-native-toast-message';

export const FALLBACK_ERROR_MESSAGE =
  'Something went wrong. Please try again.';

/** Map API / mongoose field names → Formik field names. */
export const API_FIELD_ALIASES: Record<string, string> = {
  current_password: 'existing',
  new_password: 'password',
  password_confirmation: 'password_confirmation',
  confirm_password: 'confirmPassword',
  mailing_address: 'mailing_address',
  boat_model: 'model',
  length: 'vessel_length',
  primary_phone: 'primary_phone',
  secondary_phone: 'secondary_phone',
  hin_number: 'hin_number',
  hull_color: 'hull_color',
  primary_boating_location: 'primary_boating_location',
  'owner_agreement.owner_name': 'vessel_owner_name',
  owner_name: 'vessel_owner_name',
};

export type ParsedFormApiError = {
  fieldErrors: Record<string, string>;
  generalMessage?: string;
};

type MessageFieldHint = {
  match: RegExp;
  field: string;
};

const DEFAULT_MESSAGE_HINTS: MessageFieldHint[] = [
  {match: /already exists|user already exists/i, field: 'email'},
  {match: /user doesn'?t exist|does not exist|user not exist/i, field: 'email'},
  {match: /invalid credentials/i, field: 'password'},
  {match: /invalid otp|otp has been expired|otp.*(invalid|expired)/i, field: 'otp'},
  {match: /too many invalid attempts.*code/i, field: 'otp'},
  {match: /current password/i, field: 'existing'},
  {match: /password must/i, field: 'password'},
  {match: /email is not provided/i, field: 'email'},
  {match: /email and password are required/i, field: 'password'},
  {match: /please verify otp/i, field: 'otp'},
];

function asMessage(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (Array.isArray(value)) {
    const parts = value.map(asMessage).filter(Boolean) as string[];
    return parts.length ? parts.join(' ') : undefined;
  }
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return asMessage((value as {message?: unknown}).message);
  }
  return undefined;
}

export function getApiErrorBody(error: unknown): {
  status?: number | string;
  message?: string;
  code?: string;
  errors?: Record<string, unknown>;
} {
  if (!error || typeof error !== 'object') {
    return {};
  }

  const err = error as Record<string, any>;
  // RTK Query unwrap / FetchBaseQueryError
  const data = err.data ?? err?.error?.data;
  const status = err.status ?? err?.error?.status;

  if (data && typeof data === 'object') {
    return {
      status,
      message: asMessage(data.message) ?? asMessage(data.error),
      code: typeof data.code === 'string' ? data.code : undefined,
      errors:
        data.errors && typeof data.errors === 'object'
          ? (data.errors as Record<string, unknown>)
          : undefined,
    };
  }

  if (typeof err.message === 'string' && err.message !== 'Rejected') {
    return {status, message: err.message};
  }

  if (typeof err.error === 'string' && err.error.trim()) {
    return {status, message: err.error.trim()};
  }

  return {status};
}

/** RTK abort / resetApiState — not a real API failure. */
export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as Record<string, any>;
  const text = String(err.error ?? err.message ?? err.name ?? '');
  return (
    err.name === 'AbortError' ||
    err.meta?.aborted === true ||
    /abort/i.test(text)
  );
}

function resolveFieldName(
  rawKey: string,
  knownFields: readonly string[],
  aliases: Record<string, string>,
): string | null {
  if (knownFields.includes(rawKey)) {
    return rawKey;
  }
  const aliased = aliases[rawKey] || aliases[rawKey.replace(/^.*\./, '')];
  if (aliased && knownFields.includes(aliased)) {
    return aliased;
  }
  // nested key leaf
  const leaf = rawKey.includes('.') ? rawKey.split('.').pop()! : rawKey;
  if (knownFields.includes(leaf)) {
    return leaf;
  }
  if (aliases[leaf] && knownFields.includes(aliases[leaf])) {
    return aliases[leaf];
  }
  return null;
}

function normalizeServerErrors(
  errors: Record<string, unknown>,
  knownFields: readonly string[],
  aliases: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    const field = resolveFieldName(key, knownFields, aliases);
    const message = asMessage(value);
    if (field && message && !out[field]) {
      out[field] = message;
    }
  }
  return out;
}

function hintFieldFromMessage(
  message: string,
  knownFields: readonly string[],
  hints: MessageFieldHint[],
): string | null {
  for (const hint of hints) {
    if (hint.match.test(message) && knownFields.includes(hint.field)) {
      return hint.field;
    }
  }
  return null;
}

export function parseFormApiError(
  error: unknown,
  knownFields: readonly string[],
  options?: {
    aliases?: Record<string, string>;
    messageHints?: MessageFieldHint[];
  },
): ParsedFormApiError {
  const body = getApiErrorBody(error);
  const aliases = {...API_FIELD_ALIASES, ...options?.aliases};
  const hints = [...(options?.messageHints || []), ...DEFAULT_MESSAGE_HINTS];

  let fieldErrors: Record<string, string> = {};

  if (body.errors) {
    fieldErrors = normalizeServerErrors(body.errors, knownFields, aliases);
  }

  const message = body.message;

  if (message && Object.keys(fieldErrors).length === 0) {
    const hinted = hintFieldFromMessage(message, knownFields, hints);
    if (hinted) {
      fieldErrors[hinted] = message;
    }
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  // Prefer field-only UX when everything mapped; otherwise keep a toast message.
  if (hasFieldErrors) {
    // If server also sent unmapped fields in errors, surface remainder as general.
    const unmappedMessages: string[] = [];
    if (body.errors) {
      for (const [key, value] of Object.entries(body.errors)) {
        if (!resolveFieldName(key, knownFields, aliases)) {
          const msg = asMessage(value);
          if (msg) {
            unmappedMessages.push(msg);
          }
        }
      }
    }
    return {
      fieldErrors,
      generalMessage: unmappedMessages.length
        ? unmappedMessages.join(' ')
        : undefined,
    };
  }

  return {
    fieldErrors: {},
    generalMessage: message || FALLBACK_ERROR_MESSAGE,
  };
}

type FormikErrorHelpers = Pick<
  FormikHelpers<any>,
  'setErrors' | 'setFieldTouched' | 'setStatus'
>;

export type ServerErrorShakeStatus = {
  serverErrorShakeAt?: number;
  serverErrorFields?: string[];
};

export function applyFormApiError(
  error: unknown,
  helpers: FormikErrorHelpers,
  knownFields: readonly string[],
  options?: {
    aliases?: Record<string, string>;
    messageHints?: MessageFieldHint[];
    toastTitle?: string;
    suppressToast?: boolean;
  },
): ParsedFormApiError {
  if (isAbortError(error)) {
    return {fieldErrors: {}};
  }

  const parsed = parseFormApiError(error, knownFields, options);
  const fieldKeys = Object.keys(parsed.fieldErrors);

  if (fieldKeys.length > 0) {
    helpers.setErrors(parsed.fieldErrors);
    fieldKeys.forEach(field => {
      helpers.setFieldTouched(field, true, false);
    });
    helpers.setStatus?.({
      serverErrorShakeAt: Date.now(),
      serverErrorFields: fieldKeys,
    } satisfies ServerErrorShakeStatus);
  }

  if (parsed.generalMessage && !options?.suppressToast) {
    showGeneralError(parsed.generalMessage, options?.toastTitle);
  }

  return parsed;
}

export function showGeneralError(message?: string, title = 'Error') {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message?.trim() || FALLBACK_ERROR_MESSAGE,
  });
}

/** Mutations whose failures are handled by form controllers (no global toast). */
export const FORM_HANDLED_MUTATIONS = new Set([
  'login',
  'signup',
  'uploadSignupImage',
  'forgotPassword',
  'verify',
  'setPassword',
  'updateProfile',
  'changePassword',
  'contactUs',
  'createFamily',
  'createVessel',
  'uploadImage',
]);

/**
 * Mutations that show their own toasts / dialogs.
 * Global middleware must not also toast these.
 */
export const LOCALLY_HANDLED_MUTATIONS = new Set([
  ...FORM_HANDLED_MUTATIONS,
  'getAppleWalletPass',
  'getGoogleWalletPass',
  'deleteVessel',
  'deleteFamily',
  'deleteAccount',
  'logout',
]);

export function getApiErrorMessage(
  error: unknown,
  fallback: string = FALLBACK_ERROR_MESSAGE,
): string {
  const body = getApiErrorBody(error);
  return body.message?.trim() || fallback;
}