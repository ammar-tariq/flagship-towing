// Country dial metadata from react-native-country-picker-modal (direct dep).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const countriesRaw = require('react-native-country-picker-modal/lib/assets/data/countries-emoji.json') as Record<
  string,
  {
    callingCode?: string[];
    name?: {common?: string} | string;
  }
>;

export type CountryOption = {
  cca2: string;
  name: string;
  callingCode: string;
  flag: string;
};

/** ISO 3166-1 alpha-2 → regional-indicator flag emoji */
export const flagEmoji = (cca2: string) =>
  cca2
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );

const PREFERRED = ['US', 'CA', 'GB', 'AU', 'MX'];

const allCountries: CountryOption[] = Object.entries(countriesRaw)
  .filter(([, meta]) => Boolean(meta?.callingCode?.[0]))
  .map(([cca2, meta]) => ({
    cca2,
    name:
      typeof meta.name === 'string'
        ? meta.name
        : meta.name?.common || cca2,
    callingCode: meta.callingCode![0],
    flag: flagEmoji(cca2),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const preferred = PREFERRED.map(code =>
  allCountries.find(c => c.cca2 === code),
).filter(Boolean) as CountryOption[];

const preferredSet = new Set(PREFERRED);
const rest = allCountries.filter(c => !preferredSet.has(c.cca2));

export const COUNTRY_OPTIONS: CountryOption[] = [...preferred, ...rest];

export const getCountryByCode = (cca2: string): CountryOption =>
  COUNTRY_OPTIONS.find(c => c.cca2 === cca2) ??
  COUNTRY_OPTIONS.find(c => c.cca2 === 'US')!;

/** Match longest calling code prefix (e.g. 1 vs 44). */
export const findCountryByCallingCode = (
  digits: string,
): CountryOption | undefined => {
  const normalized = digits.replace(/\D/g, '');
  if (!normalized) {
    return undefined;
  }
  return COUNTRY_OPTIONS.filter(c => normalized.startsWith(c.callingCode)).sort(
    (a, b) => b.callingCode.length - a.callingCode.length,
  )[0];
};

/**
 * Display phone with country calling code, e.g. "+1 5551234567".
 * Accepts national digits or values that already include + / country code.
 */
export const formatPhoneDisplay = (
  phone?: string | null,
  defaultCca2 = 'US',
): string => {
  if (phone == null || !String(phone).trim()) {
    return '';
  }

  const trimmed = String(phone).trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  const matched = findCountryByCallingCode(digits);
  const fallback = getCountryByCode(defaultCca2);

  // Prefer explicit + / matched prefix; otherwise assume default country (US).
  if (hasPlus && matched) {
    const national = digits.slice(matched.callingCode.length);
    return national
      ? `+${matched.callingCode} ${national}`
      : `+${matched.callingCode}`;
  }

  if (!hasPlus && digits.length > 10 && matched) {
    const national = digits.slice(matched.callingCode.length);
    return national
      ? `+${matched.callingCode} ${national}`
      : `+${matched.callingCode}`;
  }

  return `+${fallback.callingCode} ${digits}`;
};

export const filterCountries = (
  query: string,
  options: CountryOption[] = COUNTRY_OPTIONS,
): CountryOption[] => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return options;
  }
  return options.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.cca2.toLowerCase().includes(q) ||
      c.callingCode.includes(q.replace(/^\+/, '')),
  );
};
