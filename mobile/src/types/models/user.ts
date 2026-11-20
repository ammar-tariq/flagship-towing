export type MembershipStatus = 'none' | 'active' | 'expired' | 'cancelled' | string;

export type User = {
  _id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  primary_phone?: string;
  mailing_address?: string;
  picture?: string;
  membership_status?: MembershipStatus;
};
