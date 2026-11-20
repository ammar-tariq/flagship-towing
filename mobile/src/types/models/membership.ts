import type {Vessel} from './vessel';

export type PackagePrice = {
  id: string;
  unit_amount: number;
  recurring?: {interval: string};
};

export type MembershipPackage = {
  _id?: string;
  name?: string;
  description?: string;
  images?: string[];
  prices?: PackagePrice[];
};

export type Subscription = {
  id: string;
  name?: string;
  amount?: number;
  interval?: string;
  current_period_end?: string | number;
  cancel_at_period_end?: boolean;
  status?: string;
  source?: 'offline' | 'admin' | string;
  vessel?: Vessel;
};
