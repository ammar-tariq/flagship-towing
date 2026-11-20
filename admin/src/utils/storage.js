/**
 * Plain JSON storage for auth (no client-side AES — keys in the bundle are not secrets).
 * Access/refresh tokens: sessionStorage by default; localStorage when "remember me".
 */
import { LocalStorage, SessionStorage } from "./enums";

const webStorage = (type) =>
  type === SessionStorage ? sessionStorage : localStorage;

const serialize = (data) => {
  if (data == null) return null;
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
};

const deserialize = (raw) => {
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const insertData = (data, key, type = SessionStorage) => {
  const Storage = webStorage(type);
  const data_to_store = serialize(data);
  if (data_to_store != null) Storage.setItem(key, data_to_store);
};

const extractData = (key, type = SessionStorage) => {
  const Storage = webStorage(type);
  const data = Storage.getItem(key);
  if (!data) return null;
  return deserialize(data);
};

const resetData = () => {
  sessionStorage.clear();
  localStorage.clear();
};

const insertAuthData = (data, key, rememberMe) => {
  const primary = rememberMe ? LocalStorage : SessionStorage;
  const secondary = rememberMe ? SessionStorage : LocalStorage;
  webStorage(secondary).removeItem(key);
  insertData(data, key, primary);
};

const extractAuthData = (key) => {
  const fromSession = extractData(key, SessionStorage);
  if (fromSession != null) return fromSession;
  return extractData(key, LocalStorage);
};

const hasRememberedSession = () =>
  localStorage.getItem("refresh_token") != null ||
  localStorage.getItem("access_token") != null;

export {
  extractAuthData,
  extractData,
  insertAuthData,
  insertData,
  resetData,
  hasRememberedSession,
};
