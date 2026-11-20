export type Vessel = {
  _id: string;
  first_name?: string;
  last_name?: string;
  mailing_address?: string;
  primary_phone?: string;
  secondary_phone?: string;
  email?: string;
  make?: string;
  boat_model?: string;
  year?: number;
  registration?: string;
  hin_number?: string;
  length?: number;
  hull_color?: string;
  primary_boating_location?: string;
  images?: string[];
  offline_membership_type?: string;
  offline_membership_expires_at?: string;
  advName?: string;
  captainName?: string;
};

export type VesselOwnerAgreement = {
  owner_name: string;
  agreement_date: string;
};

export type CreateVesselBody = {
  first_name: string;
  last_name: string;
  mailing_address: string;
  primary_phone: string;
  secondary_phone?: string;
  email: string;
  make: string;
  boat_model: string;
  registration: string;
  hin_number?: string;
  length?: number;
  year?: number;
  hull_color: string;
  primary_boating_location: string;
  owner_agreement: VesselOwnerAgreement;
  advName: string;
  captainName?: string;
  images: string[];
};
