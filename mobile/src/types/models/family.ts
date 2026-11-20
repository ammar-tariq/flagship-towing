export type FamilyMember = {
  _id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  relation?: string;
  status?: 'pending' | 'rejected' | string;
};

export type CreateFamilyBody = {
  first_name: string;
  last_name: string;
  email: string;
  relation: string;
  phone: string;
};
