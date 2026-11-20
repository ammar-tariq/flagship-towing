export type FaqItem = {
  title?: string;
  question?: string;
  answer?: string;
};

export type SafetyTip = {
  text?: string;
};

export type EmergencyBlock = {
  subTitle?: string;
  items?: {text?: string}[];
};

export type AppContent = {
  about_us?: string;
  privacy_policy?: string;
  terms_and_conditions?: string;
  member_agreement?: string;
  locations?: string;
  locationsFrame?: string;
  faqs?: FaqItem[];
  safety_tips?: SafetyTip[];
  emergency_situation?: EmergencyBlock;
};

export type NotificationItem = {
  _id: string;
  createdAt?: string;
  isRead?: boolean;
  notification?: {
    title?: string;
    body?: string;
  };
};
