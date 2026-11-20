export type ApiMessage = {
  message?: string;
  success?: boolean;
};

export type ApiData<T> = ApiMessage & {
  data: T;
};

export type ApiErrorBody = {
  message?: string;
  error?: string;
  code?: string;
  errors?: Record<string, unknown>;
};
